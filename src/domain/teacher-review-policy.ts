/**
 * 교사 검수 및 지도 관리 정책
 * domain/teacher-review-policy.ts
 */

import { DEMO_LIMITS } from "../contracts/limits";
import type { Verdict, ErrorType } from "../contracts/domain";

export interface TeacherReviewPolicyContext {
  verdict: Verdict;
  errorLineId: string | null;
  errorType: ErrorType | null;
  correctionReason: string;
}

/**
 * 교사의 판정 수정 사유 검증 (10~500자)
 */
export function validateCorrectionReason(reason: string): { valid: boolean; error?: string } {
  const trimmed = reason.trim();
  if (trimmed.length < 10) {
    return { valid: false, error: "수정 사유는 최소 10자 이상 구체적으로 작성해야 합니다." };
  }
  if (trimmed.length > 500) {
    return { valid: false, error: "수정 사유는 최대 500자까지 작성할 수 있습니다." };
  }
  return { valid: true };
}

/**
 * 직접 지도 종결(TEACHER_CLOSED) 사유 검증 (20~1000자)
 */
export function validateCloseReason(reason: string): { valid: boolean; error?: string } {
  const trimmed = reason.trim();
  if (trimmed.length < 20) {
    return { valid: false, error: "직접 지도 완료 설명은 최소 20자 이상 상세히 작성해야 합니다." };
  }
  if (trimmed.length > 1000) {
    return { valid: false, error: "직접 지도 완료 설명은 최대 1000자까지 작성할 수 있습니다." };
  }
  return { valid: true };
}

/**
 * 추가 재풀이 기회 1회 허용 자격 및 사유 검증
 * - 기본 4회 소진 후 추가 1회씩, 최대 2회(총 6회)까지 가능
 * - 사유 10~300자 필수
 */
export function canGrantExtraAttempt(
  evaluatedCount: number,
  maxCount: number,
  extraAllowance: number,
): boolean {
  // 한도에 도달했을 때만 추가 기회 허용 가능
  const totalMax = maxCount + extraAllowance;
  if (evaluatedCount < totalMax) {
    return false;
  }
  return extraAllowance < DEMO_LIMITS.MAX_EXTRA_ATTEMPT_ALLOWANCE;
}

export function validateExtraAttemptReason(reason: string): { valid: boolean; error?: string } {
  const trimmed = reason.trim();
  if (trimmed.length < 10) {
    return { valid: false, error: "추가 기회 부여 사유는 최소 10자 이상 작성해야 합니다." };
  }
  if (trimmed.length > 300) {
    return { valid: false, error: "추가 기회 부여 사유는 최대 300자까지 작성할 수 있습니다." };
  }
  return { valid: true };
}
