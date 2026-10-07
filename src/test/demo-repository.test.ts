import { describe, expect, it, beforeEach } from "vitest";
import { DemoRepository } from "../services/demo-repository";

describe("DemoRepository", () => {
  let repo: DemoRepository;

  beforeEach(() => {
    repo = new DemoRepository();
  });

  describe("세션 및 계정 전환", () => {
    it("기본 세션은 학생 A(usr_student_01)로 초기화된다", async () => {
      const res = await repo.getSession();
      expect("data" in res).toBe(true);
      if ("data" in res) {
        expect(res.data.actorId).toBe("usr_student_01");
        expect(res.data.role).toBe("STUDENT");
      }
    });

    it("setDemoSession으로 교사(usr_teacher_01)로 역할을 전환할 수 있다", async () => {
      const res = await repo.setDemoSession("usr_teacher_01");
      expect("data" in res).toBe(true);
      if ("data" in res) {
        expect(res.data.role).toBe("TEACHER");
        expect(res.data.name).toBe("강선생");
      }
    });
  });

  describe("학생 케이스 조회 및 공개 DTO 격리", () => {
    it("학생 본인의 케이스를 성공적으로 조회하고 비공개 필드가 노출되지 않는다", async () => {
      const res = await repo.getStudentCase("case_01");
      expect("data" in res).toBe(true);
      if ("data" in res) {
        const dto = res.data;
        expect(dto.caseId).toBe("case_01");
        expect(dto.verdict).toBe("INCORRECT");
        expect(dto.canRevealNextHint).toBe(true);

        // 보안 검증: 학생 DTO에는 내부 메모, 교사 검수 이력, candidateAnswer가 존재하지 않아야 함
        const rawDto = dto as unknown as Record<string, unknown>;
        expect(rawDto["internalTeacherMemo"]).toBeUndefined();
        expect(rawDto["auditHistory"]).toBeUndefined();
        expect(rawDto["candidateAnswer"]).toBeUndefined();
      }
    });

    it("다른 학생의 케이스를 조회하려고 하면 FORBIDDEN 에러를 반환한다", async () => {
      // 학생 A 상태에서 학생 B의 case_03 조회 시도
      const res = await repo.getStudentCase("case_03");
      expect("error" in res).toBe(true);
      if ("error" in res) {
        expect(res.error.code).toBe("FORBIDDEN");
      }
    });

    it("존재하지 않는 케이스는 NOT_FOUND 에러를 반환한다", async () => {
      const res = await repo.getStudentCase("non_existing_case");
      expect("error" in res).toBe(true);
      if ("error" in res) {
        expect(res.error.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("힌트 순차 공개 및 멱등성", () => {
    it("1단계 힌트가 이미 열린 상태에서 2단계 힌트를 열람할 수 있다", async () => {
      // case_01은 fixture에서 1단계가 열려 있음
      const res = await repo.revealHint({
        attemptId: "att_01_1",
        resultVersion: 1,
        level: 2,
        idempotencyKey: "hint_key_2",
      });

      expect("data" in res).toBe(true);
      if ("data" in res) {
        expect(res.data.revealedLevel).toBe(2);
        expect(res.data.hint).toContain("14 - 5");
      }
    });

    it("동일한 힌트를 중복 요청하면 멱등하게 기존 내용을 반환한다", async () => {
      const res1 = await repo.revealHint({
        attemptId: "att_01_1",
        resultVersion: 1,
        level: 1,
        idempotencyKey: "hint_dup_1",
      });
      const res2 = await repo.revealHint({
        attemptId: "att_01_1",
        resultVersion: 1,
        level: 1,
        idempotencyKey: "hint_dup_2",
      });

      expect("data" in res1).toBe(true);
      expect("data" in res2).toBe(true);
      if ("data" in res1 && "data" in res2) {
        expect(res1.data.hint).toBe(res2.data.hint);
      }
    });

    it("결과 버전이 불일치하면 VERSION_CONFLICT를 반환한다", async () => {
      const res = await repo.revealHint({
        attemptId: "att_01_1",
        resultVersion: 999, // 틀린 버전
        level: 2,
        idempotencyKey: "hint_wrong_ver",
      });

      expect("error" in res).toBe(true);
      if ("error" in res) {
        expect(res.error.code).toBe("VERSION_CONFLICT");
      }
    });
  });

  describe("시도 횟수 한도 및 교사 추가 허용", () => {
    it("4회 시도를 초과한 케이스(case_04)에 대해 추가 재풀이가 차단된다", async () => {
      // 학생 C(usr_student_03)로 전환
      await repo.setDemoSession("usr_student_03");

      // case_04는 maxEvaluatedCount 5 (기존 allowance 1 포함)로 설정되어 있음
      // 시도하여 5회를 채운 후 6회 시도 시 차단 확인
      const retryRes = await repo.createRetry({
        caseId: "case_04",
        workPhotoRefs: [
          {
            clientPhotoId: "p_retry",
            purpose: "WORK",
            order: 1,
            width: 800,
            height: 800,
            mime: "image/jpeg",
            bytes: 100000,
            editedRevision: 5,
          },
        ],
        confirmedPhotoRevision: 5,
        privacyChecked: true,
        legibilityChecked: true,
        idempotencyKey: "retry_5",
      });
      expect("data" in retryRes).toBe(true);

      // 이제 5회 완료 후 6회째 시도 -> QUOTA_EXCEEDED
      const failRetry = await repo.createRetry({
        caseId: "case_04",
        workPhotoRefs: [
          {
            clientPhotoId: "p_retry_6",
            purpose: "WORK",
            order: 1,
            width: 800,
            height: 800,
            mime: "image/jpeg",
            bytes: 100000,
            editedRevision: 6,
          },
        ],
        confirmedPhotoRevision: 6,
        privacyChecked: true,
        legibilityChecked: true,
        idempotencyKey: "retry_6",
      });
      expect("error" in failRetry).toBe(true);
      if ("error" in failRetry) {
        expect(failRetry.error.code).toBe("QUOTA_EXCEEDED");
      }
    });
  });

  describe("교사 검수 및 버전 충돌", () => {
    it("교사가 진단 결과를 수정하면 resultVersion이 증가하고 이력이 기록된다", async () => {
      await repo.setDemoSession("usr_teacher_01");

      const reviewRes = await repo.saveTeacherReview({
        caseId: "case_01",
        attemptId: "att_01_1",
        expectedVersion: 1,
        verdict: "INCORRECT",
        errorType: "SIGN",
        conceptId: "M1_EQ_TRANSPOSE",
        errorRegion: { lineId: "L02", bbox: { x: 0.1, y: 0.3, w: 0.8, h: 0.2 } },
        publicStudentMessage: "선생님이 직접 확인했어요: 이항할 때 부호를 꼭 확인하세요.",
        internalTeacherMemo: "이항 개념 반복 실수 확인됨.",
        idempotencyKey: "review_save_01",
      });

      expect("data" in reviewRes).toBe(true);
      if ("data" in reviewRes) {
        expect(reviewRes.data.resultVersion).toBe(2);
      }

      // 교사 케이스 확인
      const caseRes = await repo.getTeacherCase("case_01");
      if ("data" in caseRes) {
        expect(caseRes.data.auditHistory.length).toBe(1);
        expect(caseRes.data.internalTeacherMemo).toBe("이항 개념 반복 실수 확인됨.");
      }
    });

    it("expectedVersion이 맞지 않으면 VERSION_CONFLICT를 반환한다", async () => {
      await repo.setDemoSession("usr_teacher_01");

      const res = await repo.saveTeacherReview({
        caseId: "case_01",
        attemptId: "att_01_1",
        expectedVersion: 99,
        verdict: "CORRECT",
        errorType: "UNKNOWN",
        conceptId: "UNKNOWN",
        errorRegion: null,
        publicStudentMessage: "정답입니다.",
        idempotencyKey: "review_wrong_ver",
      });

      expect("error" in res).toBe(true);
      if ("error" in res) {
        expect(res.error.code).toBe("VERSION_CONFLICT");
      }
    });
  });

  describe("복습 후보 및 승인 흐름", () => {
    it("복습 후보를 생성하고 승인하면 학생 목록에 노출된다", async () => {
      await repo.setDemoSession("usr_teacher_01");

      const candRes = await repo.createReviewCandidate({
        sourceCaseId: "case_01",
        templateId: "tpl_linear_01",
        difficulty: "MEDIUM",
        idempotencyKey: "cand_01",
      });

      expect("data" in candRes).toBe(true);
      if (!("data" in candRes)) return;

      const reviewId = candRes.data.reviewId;
      expect(candRes.data.status).toBe("PENDING_APPROVAL");

      // 승인
      const approveRes = await repo.approveReviewItem({
        reviewId,
        questionVersion: 1,
        checklistPassed: true,
        idempotencyKey: "appr_01",
      });

      expect("data" in approveRes).toBe(true);

      // 학생이 복습 목록 조회
      await repo.setDemoSession("usr_student_01");
      const listRes = await repo.listStudentReviews();
      expect("data" in listRes).toBe(true);
      if ("data" in listRes) {
        expect(listRes.data.items.some((i) => i.reviewId === reviewId)).toBe(true);
      }
    });
  });

  describe("리포트 요청 및 발행, 회수", () => {
    it("리포트 요청 -> 초안 작성 -> 정식 발행 -> 학부모 열람 흐름이 동작한다", async () => {
      await repo.setDemoSession("usr_teacher_01");

      // 1. 요청 생성
      const reqRes = await repo.requestReport("usr_student_01", "2026-10-01", "2026-10-06");
      expect("data" in reqRes).toBe(true);
      if (!("data" in reqRes)) return;
      const reportId = reqRes.data.reportId;

      // 2. 초안 저장
      const draftRes = await repo.saveReportDraft({
        reportId,
        reportVersion: 1,
        teacherComment:
          "전반적인 방정식의 풀이 논리가 우수하나 이항 시 부호 실수가 일부 관찰됩니다.",
        homeQuestions: ["가정에서 이항할 때 부호를 반대로 바꾸는 규칙을 복습해 주세요."],
        idempotencyKey: "draft_save_01",
      });
      expect("data" in draftRes).toBe(true);

      // 3. 정식 발행
      const pubRes = await repo.publishReport({
        reportId,
        reportVersion: 2,
        idempotencyKey: "pub_01",
      });
      expect("data" in pubRes).toBe(true);

      // 4. 학부모(usr_parent_01)로 세션 전환하여 열람
      await repo.setDemoSession("usr_parent_01");
      const parentReport = await repo.getPublishedReport(reportId);
      expect("data" in parentReport).toBe(true);
      if ("data" in parentReport) {
        expect(parentReport.data.status).toBe("PUBLISHED");
        expect(parentReport.data.learnerName).toBe("김민수");
      }

      // 5. 교사가 회수
      await repo.setDemoSession("usr_teacher_01");
      const withRes = await repo.withdrawReport({
        reportId,
        reason: "오탈자 수정 및 통계 보정을 위해 임시 회수합니다.",
        idempotencyKey: "with_01",
      });
      expect("data" in withRes).toBe(true);

      // 6. 회수 후 학부모 열람 시 NOT_FOUND
      await repo.setDemoSession("usr_parent_01");
      const afterWith = await repo.getPublishedReport(reportId);
      expect("error" in afterWith).toBe(true);
    });
  });
});
