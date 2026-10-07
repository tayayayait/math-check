import { describe, expect, it } from "vitest";
import { DemoRepository } from "../services/demo-repository";
import { canResubmit } from "../domain/case-policy";
import { validateHintRequest } from "../domain/hint-policy";
import type { PhotoRef } from "../contracts/domain";

describe("Phase 9 - 핵심 시나리오 (D01 ~ D03) 및 전체 E2E 비즈니스 흐름 검증", () => {
  it("[D01] 안전 오답 접수 후 1단계 힌트 순차 공개가 정상 동작한다", async () => {
    const repo = new DemoRepository();
    await repo.setDemoSession("usr_student_01");

    // 초기 상태 확인 (case_01은 현재 level 1 힌트가 열려 있음)
    const initialCase = await repo.getStudentCase("case_01");
    expect("data" in initialCase).toBe(true);
    if (!("data" in initialCase)) return;

    expect(initialCase.data.evaluatedCount).toBe(1);
    expect(initialCase.data.revealedHints.length).toBe(1);

    // 2단계 힌트 요청
    const hintRes = await repo.revealHint({
      attemptId: initialCase.data.currentAttemptId,
      level: 2,
      resultVersion: initialCase.data.resultVersion,
      idempotencyKey: "hint_01_2",
    });
    expect("data" in hintRes).toBe(true);
    if ("data" in hintRes) {
      expect(hintRes.data.revealedLevel).toBe(2);
      expect(hintRes.data.hint).toBeDefined();
    }

    // 케이스 다시 조회 시 2단계까지 힌트가 열려 있는지 확인
    const updatedCase = await repo.getStudentCase("case_01");
    expect("data" in updatedCase).toBe(true);
    if ("data" in updatedCase) {
      expect(updatedCase.data.revealedHints.length).toBe(2);
      expect(updatedCase.data.revealedHints[1]?.level).toBe(2);
    }
  });

  it("[D02] 힌트 단계 건너뛰기(순서 위반) 시 정책 및 레포지토리에서 차단된다", async () => {
    // 1. 도메인 정책 레벨 검증: 1단계만 열려 있는 상태에서 3단계 직접 요청
    const validation = validateHintRequest(
      {
        verdict: "INCORRECT",
        currentRevealedLevel: 1,
        totalAvailableHints: 3,
        isLatestAttempt: true,
        helpRequested: false,
        isStaleResult: false,
      },
      3,
    );
    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain("이전 단계");

    // 2. 레포지토리 레벨 검증: 실제 호출 시 VALIDATION_ERROR 반환
    const repo = new DemoRepository();
    await repo.setDemoSession("usr_student_01");
    const initialCase = await repo.getStudentCase("case_01");
    if (!("data" in initialCase)) return;

    const invalidHintRes = await repo.revealHint({
      attemptId: initialCase.data.currentAttemptId,
      level: 3, // 순서 건너뛰기
      resultVersion: initialCase.data.resultVersion,
      idempotencyKey: "hint_01_3_invalid",
    });
    expect("error" in invalidHintRes).toBe(true);
    if ("error" in invalidHintRes) {
      expect(invalidHintRes.error.code).toBe("VALIDATION_ERROR");
      expect(invalidHintRes.error.message).toContain("이전 단계");
    }
  });

  it("[D03] 평가 한도 도달 시 WAITING_TEACHER로 전이되고 추가 재풀이가 차단된다", async () => {
    const repo = new DemoRepository();
    // case_04 소유자인 usr_student_03 세션으로 전환
    await repo.setDemoSession("usr_student_03");

    // 초기 상태: 4회 시도 완료, 추가 1회 기회 부여되어 총 5회 한도 중 4회 사용
    const case04Initial = await repo.getStudentCase("case_04");
    expect("data" in case04Initial).toBe(true);
    if (!("data" in case04Initial)) return;

    expect(case04Initial.data.evaluatedCount).toBe(4);
    expect(case04Initial.data.maxEvaluatedCount).toBe(5);
    expect(case04Initial.data.canResubmit).toBe(true);

    const dummyWorkPhoto: PhotoRef = {
      clientPhotoId: "photo_w_retry_final",
      purpose: "WORK",
      order: 1,
      width: 800,
      height: 900,
      mime: "image/jpeg",
      bytes: 200000,
      editedRevision: 5,
    };

    // 5번째 마지막 재풀이 제출 -> 한도 5회에 도달
    const retryRes = await repo.createRetry({
      caseId: "case_04",
      confirmedPhotoRevision: 4,
      privacyChecked: true,
      legibilityChecked: true,
      workPhotoRefs: [dummyWorkPhoto],
      idempotencyKey: "retry_attempt_5",
    });
    expect("data" in retryRes).toBe(true);

    // 제출 후 케이스 상태: evaluatedCount 5, WAITING_TEACHER, canResubmit false
    const case04After = await repo.getStudentCase("case_04");
    expect("data" in case04After).toBe(true);
    if (!("data" in case04After)) return;

    expect(case04After.data.evaluatedCount).toBe(5);
    expect(case04After.data.caseStatus).toBe("WAITING_TEACHER");
    expect(case04After.data.canResubmit).toBe(false);

    // 정책 함수 검증
    const policyAllowed = canResubmit({
      caseStatus: case04After.data.caseStatus,
      evaluatedCount: case04After.data.evaluatedCount,
      extraAttemptAllowance: case04After.data.extraAttemptAllowance,
      hasActiveJob: false,
      helpRequested: case04After.data.helpRequested,
    });
    expect(policyAllowed).toBe(false);

    // 추가 재풀이 제출 시도 시 QUOTA_EXCEEDED 차단 확인
    const overLimitRes = await repo.createRetry({
      caseId: "case_04",
      confirmedPhotoRevision: 5,
      privacyChecked: true,
      legibilityChecked: true,
      workPhotoRefs: [dummyWorkPhoto],
      idempotencyKey: "retry_attempt_6",
    });
    expect("error" in overLimitRes).toBe(true);
    if ("error" in overLimitRes) {
      expect(overLimitRes.error.code).toBe("QUOTA_EXCEEDED");
    }
  });

  it("전체 통합 라이프사이클: 교사 검수 -> 복습 승인 -> 리포트 발행 -> 보호자 열람 흐름이 완전하게 완결된다", async () => {
    const repo = new DemoRepository();

    // 1. 교사로 로그인 후 case_02 검수 수정
    await repo.setDemoSession("usr_teacher_01");
    const teachCase = await repo.getTeacherCase("case_02");
    expect("data" in teachCase).toBe(true);
    if (!("data" in teachCase)) return;

    const reviewSaveRes = await repo.saveTeacherReview({
      caseId: "case_02",
      attemptId: teachCase.data.currentAttemptId,
      expectedVersion: teachCase.data.resultVersion,
      verdict: "CORRECT",
      errorType: "UNKNOWN",
      conceptId: "UNKNOWN",
      errorRegion: null,
      publicStudentMessage: "모든 풀이 과정이 바르게 작성되었습니다!",
      internalTeacherMemo: "교사가 정답으로 검수 승인함",
      idempotencyKey: "review_save_e2e_01",
    });
    expect("data" in reviewSaveRes).toBe(true);

    // 2. 복습 후보 승인
    const approveRes = await repo.approveReviewItem({
      reviewId: "rev_01",
      questionVersion: 1,
      checklistPassed: true,
      idempotencyKey: "approve_rev_01",
    });
    expect("data" in approveRes).toBe(true);

    // 3. 리포트 발행
    const pubRes = await repo.publishReport({
      reportId: "rep_01",
      reportVersion: 1,
      idempotencyKey: "pub_test_e2e",
    });
    expect("data" in pubRes).toBe(true);

    // 4. 학부모 세션 전환 후 발행 리포트 열람
    await repo.setDemoSession("usr_parent_01");
    const parentRep = await repo.getPublishedReport("rep_01");
    expect("data" in parentRep).toBe(true);
    if ("data" in parentRep) {
      expect(parentRep.data.status).toBe("PUBLISHED");
      expect(parentRep.data.learnerName).toBe("김민수");
    }
  });
});
