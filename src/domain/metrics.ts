/**
 * 학습 분석 지표 및 집계 계산 엔진
 * domain/metrics.ts
 */

import type { ConceptId, Verdict } from "../contracts/domain";

export interface CaseAttemptRecord {
  caseId: string;
  kind: "ORIGINAL" | "REVIEW";
  attemptIndex: number; // 0: 첫 시도, 1+: 재풀이
  verdict: Verdict;
  conceptId: ConceptId;
  createdAt: string; // ISO
  caseStatus: string;
  helpRequested: boolean;
  reviewStatus: string;
  maxHintLevelUsed: number;
}

export interface MetricSummary {
  /** 기간 내 접수된 원문 문제 수 (ORIGINAL 기준, 사진/재풀이 제외) */
  totalOriginalProblems: number;
  /** 최초 정답률 (백분율: 0 ~ 100, 분모 0 시 null) */
  initialAccuracyRate: number | null;
  /** 오답 문제 수 */
  incorrectProblemCount: number;
  /** 재풀이 완료 문제 수 */
  resolvedProblemCount: number;
  /** 재풀이 성공률 (백분율: 0 ~ 100, 분모 0 시 null) */
  retrySuccessRate: number | null;
  /** 선생님 확인 대기 건수 */
  waitingTeacherCount: number;
  /** 최대 열람 힌트 레벨 */
  maxHintUsageLevel: number;
  /** 반복 오답 개념 목록 (14일 내 3건 이상) */
  repeatedConcepts: Array<{ conceptId: ConceptId; count: number }>;
  /** 취약 가능성 개념 목록 (30일 내 3건 이상 시도 & 최초 오답률 >= 50%) */
  vulnerableConcepts: Array<{ conceptId: ConceptId; initialErrorRate: number }>;
}

export function formatRatePercent(rate: number | null): string {
  if (rate === null) return "—";
  return `${rate.toFixed(1)}%`;
}

export function formatTeacherMetric(
  rate: number | null,
  numerator: number,
  denominator: number,
): string {
  if (denominator === 0 || rate === null) return "—";
  return `${rate.toFixed(1)}% · ${numerator}/${denominator}`;
}

export function calculateMetrics(
  records: CaseAttemptRecord[],
  options?: { now?: Date },
): MetricSummary {
  const now = options?.now ?? new Date();
  const nowMs = now.getTime();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  // 1. ORIGINAL 케이스별로 그룹화
  const casesMap = new Map<string, CaseAttemptRecord[]>();
  for (const r of records) {
    if (r.kind !== "ORIGINAL") continue;
    const list = casesMap.get(r.caseId) ?? [];
    list.push(r);
    casesMap.set(r.caseId, list);
  }

  const totalOriginalProblems = casesMap.size;

  let initialCorrectCount = 0;
  let initialDeterminedCount = 0;
  let incorrectProblemCount = 0;
  let resolvedProblemCount = 0;
  let waitingTeacherCount = 0;
  let maxHintUsageLevel = 0;

  // 14일 / 30일 개념 추적용
  const repeatedConceptMap = new Map<ConceptId, number>();
  const conceptAttemptMap = new Map<ConceptId, { total: number; incorrect: number }>();

  for (const [, attempts] of casesMap.entries()) {
    // attemptIndex 오름차순 정렬
    attempts.sort((a, b) => a.attemptIndex - b.attemptIndex);
    const firstAttempt = attempts[0];
    if (!firstAttempt) continue;

    // 최초 정답률 계산
    if (firstAttempt.verdict === "CORRECT") {
      initialCorrectCount++;
      initialDeterminedCount++;
    } else if (firstAttempt.verdict === "INCORRECT") {
      initialDeterminedCount++;
    }

    // 힌트 사용량 추적
    for (const att of attempts) {
      if (att.maxHintLevelUsed > maxHintUsageLevel) {
        maxHintUsageLevel = att.maxHintLevelUsed;
      }
    }

    // 오답 여부 확인 (한 번이라도 INCORRECT가 있었는지)
    const hasIncorrect = attempts.some((a) => a.verdict === "INCORRECT");
    if (hasIncorrect) {
      incorrectProblemCount++;
      // 재풀이(attemptIndex > 0) 중 유효한 CORRECT가 있는지 확인
      const retryResolved = attempts.some((a) => a.attemptIndex > 0 && a.verdict === "CORRECT");
      if (retryResolved) {
        resolvedProblemCount++;
      }
    }

    // 교사 대기 건수
    const latestAttempt = attempts[attempts.length - 1];
    if (
      latestAttempt &&
      (latestAttempt.caseStatus === "WAITING_TEACHER" ||
        latestAttempt.helpRequested ||
        latestAttempt.reviewStatus === "PENDING" ||
        latestAttempt.reviewStatus === "IN_REVIEW") &&
      latestAttempt.caseStatus !== "RESOLVED" &&
      latestAttempt.caseStatus !== "TEACHER_CLOSED"
    ) {
      waitingTeacherCount++;
    }

    // 14일 반복 오답 개념 분석 (서로 다른 ORIGINAL 케이스에서 오답 발생)
    const attemptTime = new Date(firstAttempt.createdAt).getTime();
    if (
      hasIncorrect &&
      nowMs - attemptTime <= fourteenDaysMs &&
      firstAttempt.conceptId !== "UNKNOWN"
    ) {
      const current = repeatedConceptMap.get(firstAttempt.conceptId) ?? 0;
      repeatedConceptMap.set(firstAttempt.conceptId, current + 1);
    }

    // 30일 취약 개념 분석 (최초 시도 기준)
    if (nowMs - attemptTime <= thirtyDaysMs && firstAttempt.conceptId !== "UNKNOWN") {
      const stats = conceptAttemptMap.get(firstAttempt.conceptId) ?? { total: 0, incorrect: 0 };
      if (firstAttempt.verdict === "CORRECT" || firstAttempt.verdict === "INCORRECT") {
        stats.total++;
        if (firstAttempt.verdict === "INCORRECT") {
          stats.incorrect++;
        }
        conceptAttemptMap.set(firstAttempt.conceptId, stats);
      }
    }
  }

  const initialAccuracyRate =
    initialDeterminedCount === 0 ? null : (initialCorrectCount / initialDeterminedCount) * 100;

  const retrySuccessRate =
    incorrectProblemCount === 0 ? null : (resolvedProblemCount / incorrectProblemCount) * 100;

  const repeatedConcepts: Array<{ conceptId: ConceptId; count: number }> = [];
  for (const [conceptId, count] of repeatedConceptMap.entries()) {
    if (count >= 3) {
      repeatedConcepts.push({ conceptId, count });
    }
  }

  const vulnerableConcepts: Array<{ conceptId: ConceptId; initialErrorRate: number }> = [];
  for (const [conceptId, stats] of conceptAttemptMap.entries()) {
    if (stats.total >= 3) {
      const errorRate = (stats.incorrect / stats.total) * 100;
      if (errorRate >= 50) {
        vulnerableConcepts.push({ conceptId, initialErrorRate: errorRate });
      }
    }
  }

  return {
    totalOriginalProblems,
    initialAccuracyRate,
    incorrectProblemCount,
    resolvedProblemCount,
    retrySuccessRate,
    waitingTeacherCount,
    maxHintUsageLevel,
    repeatedConcepts,
    vulnerableConcepts,
  };
}
