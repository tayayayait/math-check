/**
 * 복습 문제 관리 및 검증 정책 엔진
 * domain/review-policy.ts
 */

import type { CaseKind, CaseStatus, ReviewItemStatus, Verdict } from "../contracts/domain";
import type { ReviewItemChecklist } from "../contracts/review-item";

/**
 * 복습 문제 후보 생성 가능 여부 확인
 * - 복습 문제(REVIEW) 자체에서는 재귀적으로 복습 문제를 추가 생성하지 않음
 * - 원문에서 한 번이라도 유효 오답이 발생한 경우에만 1개 생성 (최초 정답 제외)
 * - 후보는 최대 3개까지만 허용
 */
export function canCreateReviewCandidate(
  kind: CaseKind,
  existingCandidateCount: number,
  firstAttemptVerdict?: Verdict,
): boolean {
  if (kind === "REVIEW") return false;
  if (firstAttemptVerdict === "CORRECT") return false;
  if (existingCandidateCount >= 3) return false;
  return true;
}

/**
 * 8개 검수 체크리스트 완전 통과 여부 검증
 */
export function validateReviewChecklist(checklist: ReviewItemChecklist): boolean {
  return (
    checklist.sufficientConditions &&
    checklist.solutionExistenceAndUniqueness &&
    checklist.independentAnswerMatch &&
    checklist.gradeAndUnitMatch &&
    checklist.errorConceptTargeting &&
    checklist.noUnlearnedConcepts &&
    checklist.noAnswerLeakage &&
    checklist.mobileMathLegibility
  );
}

/**
 * 교사의 복습 문제 승인 가능 여부 판정
 * - 상태가 PENDING_APPROVAL 이어야 함
 * - 시스템 자동 독립 검증이 PASS 상태여야 함
 * - 8대 검수 체크리스트가 모두 PASS 여야 함
 */
export function canApproveReviewItem(
  status: ReviewItemStatus,
  checklist: ReviewItemChecklist,
  validationStatus: "PASS" | "FAIL" | "PENDING",
): boolean {
  if (status !== "PENDING_APPROVAL") return false;
  if (validationStatus !== "PASS") return false;
  return validateReviewChecklist(checklist);
}

/**
 * 학생의 복습 문제 시작 가능 여부 판정
 * - 복습 상태가 APPROVED 또는 AVAILABLE 이어야 함
 * - 원문 문제 상태가 반드시 RESOLVED 또는 TEACHER_CLOSED 여야 함 (원문 학습 완료 전에는 비공개)
 */
export function canStartReviewItem(
  reviewStatus: ReviewItemStatus,
  originalCaseStatus: CaseStatus,
): boolean {
  const isEligibleStatus = reviewStatus === "AVAILABLE" || reviewStatus === "APPROVED";
  if (!isEligibleStatus) return false;

  const isOriginalResolved =
    originalCaseStatus === "RESOLVED" || originalCaseStatus === "TEACHER_CLOSED";
  return isOriginalResolved;
}

/**
 * 복습 문제 본문 제한 규격 유효성 검사
 * - 본문 길이 <= 800자
 * - 수식 개수 <= 10개 ($ 개수로 카운트)
 */
export function validateReviewCandidateLimits(problemText: string): {
  valid: boolean;
  reason?: string;
} {
  const trimmed = problemText.trim();
  if (trimmed.length < 5) {
    return { valid: false, reason: "문제 본문은 최소 5자 이상이어야 합니다." };
  }
  if (trimmed.length > 800) {
    return { valid: false, reason: "문제 본문은 최대 800자까지 작성할 수 있습니다." };
  }

  // 수식 개수 검사 ($...$ 인라인 수식 쌍 개수)
  const mathMatches = trimmed.match(/\$[^$]+\$/g) || [];
  if (mathMatches.length > 10) {
    return {
      valid: false,
      reason: `문제 내 수식이 ${mathMatches.length}개로 한도(10개)를 초과했습니다.`,
    };
  }

  return { valid: true };
}
