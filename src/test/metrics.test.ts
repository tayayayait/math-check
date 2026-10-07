import { describe, expect, it } from "vitest";
import {
  calculateMetrics,
  formatRatePercent,
  formatTeacherMetric,
  type CaseAttemptRecord,
} from "../domain/metrics";

describe("metrics", () => {
  const fixedNow = new Date("2026-10-06T12:00:00Z");

  it("단일 케이스에 여러 재풀이 시도가 있어도 원문 문제 수(totalOriginalProblems)는 1건으로 집계된다", () => {
    const records: CaseAttemptRecord[] = [
      {
        caseId: "case_01",
        kind: "ORIGINAL",
        attemptIndex: 0,
        verdict: "INCORRECT",
        conceptId: "M1_EQ_TRANSPOSE",
        createdAt: "2026-10-06T10:00:00Z",
        caseStatus: "RETRY_REQUIRED",
        helpRequested: false,
        reviewStatus: "NONE",
        maxHintLevelUsed: 1,
      },
      {
        caseId: "case_01",
        kind: "ORIGINAL",
        attemptIndex: 1,
        verdict: "INCORRECT",
        conceptId: "M1_EQ_TRANSPOSE",
        createdAt: "2026-10-06T10:30:00Z",
        caseStatus: "RETRY_REQUIRED",
        helpRequested: false,
        reviewStatus: "NONE",
        maxHintLevelUsed: 2,
      },
      {
        caseId: "case_01",
        kind: "ORIGINAL",
        attemptIndex: 2,
        verdict: "CORRECT",
        conceptId: "M1_EQ_TRANSPOSE",
        createdAt: "2026-10-06T11:00:00Z",
        caseStatus: "RESOLVED",
        helpRequested: false,
        reviewStatus: "NONE",
        maxHintLevelUsed: 2,
      },
      // REVIEW 건은 ORIGINAL 집계에서 제외되어야 함
      {
        caseId: "rev_01",
        kind: "REVIEW",
        attemptIndex: 0,
        verdict: "CORRECT",
        conceptId: "M1_EQ_TRANSPOSE",
        createdAt: "2026-10-06T11:30:00Z",
        caseStatus: "RESOLVED",
        helpRequested: false,
        reviewStatus: "NONE",
        maxHintLevelUsed: 0,
      },
    ];

    const result = calculateMetrics(records, { now: fixedNow });
    expect(result.totalOriginalProblems).toBe(1);
    expect(result.incorrectProblemCount).toBe(1);
    expect(result.resolvedProblemCount).toBe(1);
    expect(result.retrySuccessRate).toBe(100);
    expect(result.initialAccuracyRate).toBe(0); // 첫 시도가 INCORRECT였으므로 0%
    expect(result.maxHintUsageLevel).toBe(2);
  });

  it("판정 건수가 없을 때 분모 0에 대해 비율은 null을 반환하고 '—'로 포맷팅된다", () => {
    const result = calculateMetrics([], { now: fixedNow });
    expect(result.totalOriginalProblems).toBe(0);
    expect(result.initialAccuracyRate).toBeNull();
    expect(result.retrySuccessRate).toBeNull();
    expect(formatRatePercent(result.initialAccuracyRate)).toBe("—");
    expect(formatTeacherMetric(result.initialAccuracyRate, 0, 0)).toBe("—");
  });

  it("14일 이내 서로 다른 ORIGINAL 케이스에서 동일 개념 오답이 3건 이상일 때만 반복 개념으로 감지한다", () => {
    const records2: CaseAttemptRecord[] = [
      {
        caseId: "case_a",
        kind: "ORIGINAL",
        attemptIndex: 0,
        verdict: "INCORRECT",
        conceptId: "M1_EQ_TRANSPOSE",
        createdAt: "2026-10-05T10:00:00Z",
        caseStatus: "RETRY_REQUIRED",
        helpRequested: false,
        reviewStatus: "NONE",
        maxHintLevelUsed: 1,
      },
      {
        caseId: "case_b",
        kind: "ORIGINAL",
        attemptIndex: 0,
        verdict: "INCORRECT",
        conceptId: "M1_EQ_TRANSPOSE",
        createdAt: "2026-10-04T10:00:00Z",
        caseStatus: "RETRY_REQUIRED",
        helpRequested: false,
        reviewStatus: "NONE",
        maxHintLevelUsed: 1,
      },
    ];

    // 2건일 때는 반복 개념 없음
    const res2 = calculateMetrics(records2, { now: fixedNow });
    expect(res2.repeatedConcepts.length).toBe(0);

    // 3번째 케이스 추가
    const records3: CaseAttemptRecord[] = [
      ...records2,
      {
        caseId: "case_c",
        kind: "ORIGINAL",
        attemptIndex: 0,
        verdict: "INCORRECT",
        conceptId: "M1_EQ_TRANSPOSE",
        createdAt: "2026-10-03T10:00:00Z",
        caseStatus: "RETRY_REQUIRED",
        helpRequested: false,
        reviewStatus: "NONE",
        maxHintLevelUsed: 1,
      },
    ];

    const res3 = calculateMetrics(records3, { now: fixedNow });
    expect(res3.repeatedConcepts.length).toBe(1);
    expect(res3.repeatedConcepts[0]?.conceptId).toBe("M1_EQ_TRANSPOSE");
    expect(res3.repeatedConcepts[0]?.count).toBe(3);
  });

  it("교사용 지표 포맷터를 올바르게 렌더링한다", () => {
    expect(formatTeacherMetric(66.666, 2, 3)).toBe("66.7% · 2/3");
  });
});
