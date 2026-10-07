import { describe, expect, it } from "vitest";
import { DemoRepository } from "../services/demo-repository";

describe("Phase 9 - Public DTO 격리 및 비공개 자산 누출 방지 검증", () => {
  it("학생 진단 케이스 조회 시 3단계 전체 힌트 및 교사 전용 감사 이력이 노출되지 않는다", async () => {
    const repo = new DemoRepository();
    await repo.setDemoSession("usr_student_01");

    const res = await repo.getStudentCase("case_01");
    expect("data" in res).toBe(true);
    if (!("data" in res)) return;

    const caseDto = res.data as unknown as Record<string, unknown>;

    // 비공개 필드 누출 검사
    expect(caseDto["allHints"]).toBeUndefined();
    expect(caseDto["correctAnswerFormula"]).toBeUndefined();
    expect(caseDto["independentVerification"]).toBeUndefined();
    expect(caseDto["auditHistory"]).toBeUndefined();
    expect(caseDto["teacherMemo"]).toBeUndefined();

    // 공개 허용 필드만 존재하는지 확인
    expect(caseDto["caseId"]).toBe("case_01");
    expect(caseDto["revealedHints"]).toBeDefined();
    expect(Array.isArray(caseDto["revealedHints"])).toBe(true);
  });

  it("학생 맞춤 복습 문항 조회 시 비공개 기준 정답 및 독립 검증 데이터가 누출되지 않는다", async () => {
    const repo = new DemoRepository();
    await repo.setDemoSession("usr_student_01");

    const listRes = await repo.listStudentReviews();
    expect("data" in listRes).toBe(true);
    if (!("data" in listRes)) return;

    for (const item of listRes.data.items) {
      const raw = item as unknown as Record<string, unknown>;
      // 기준 정답 및 독립 풀이 누출 여부 확인
      expect(raw["expectedAnswer"]).toBeUndefined();
      expect(raw["independentVerification"]).toBeUndefined();
      expect(raw["templatePrivateAnswer"]).toBeUndefined();
    }
  });

  it("발행된 학부모 리포트 조회 시 사진 Blob, 정답 수식 및 교사 비공개 메모가 포함되지 않는다", async () => {
    const repo = new DemoRepository();
    await repo.setDemoSession("usr_parent_01");

    const repRes = await repo.getPublishedReport("rep_02");
    expect("data" in repRes).toBe(true);
    if (!("data" in repRes)) return;

    const reportDto = repRes.data as unknown as Record<string, unknown>;

    // 리포트 스냅샷에 사진 원본, private 메모, 정답 수식 등이 없는지 확인
    expect(reportDto["photoBlob"]).toBeUndefined();
    expect(reportDto["photoDataUrl"]).toBeUndefined();
    expect(reportDto["internalAuditLog"]).toBeUndefined();
    expect(reportDto["correctAnswerFormula"]).toBeUndefined();

    // 오직 요약 지표, 총평, 가정 질문만 포함됨
    expect(reportDto["teacherComment"]).toBeDefined();
    expect(reportDto["homeQuestions"]).toBeDefined();
    expect(reportDto["metricsSummary"]).toBeDefined();
  });

  it("학생 세션에서 다른 학생의 케이스를 직접 조회하면 FORBIDDEN 에러를 반환한다", async () => {
    const repo = new DemoRepository();
    // usr_student_01 (김민수) 세션에서 usr_student_02 (이지우) 케이스인 case_03 조회 시도
    await repo.setDemoSession("usr_student_01");

    const res = await repo.getStudentCase("case_03");
    expect("error" in res).toBe(true);
    if ("error" in res) {
      expect(res.error.code).toBe("FORBIDDEN");
    }
  });
});
