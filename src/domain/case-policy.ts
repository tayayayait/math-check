/**
 * 케이스 및 시도 관련 비즈니스 정책 함수
 * domain/case-policy.ts
 */

import type { CaseStatus, Verdict } from "../contracts/domain";
import { DEMO_LIMITS } from "../contracts/limits";

export interface CasePolicyContext {
  caseStatus: CaseStatus;
  evaluatedCount: number;
  extraAttemptAllowance: number;
  hasActiveJob: boolean;
  helpRequested: boolean;
}

/**
 * 학생 재제출 가능 여부 판정
 */
export function canResubmit(ctx: CasePolicyContext): boolean {
  if (ctx.hasActiveJob) return false;
  if (ctx.caseStatus === "RESOLVED" || ctx.caseStatus === "TEACHER_CLOSED") return false;

  const maxAllowed = DEMO_LIMITS.DEFAULT_MAX_ATTEMPTS + ctx.extraAttemptAllowance;
  return ctx.evaluatedCount < maxAllowed;
}

/**
 * 선생님께 도움 요청 가능 여부 판정
 */
export function canAskTeacher(ctx: CasePolicyContext): boolean {
  if (ctx.helpRequested) return false;
  if (ctx.caseStatus === "RESOLVED" || ctx.caseStatus === "TEACHER_CLOSED") return false;
  return true;
}

/**
 * 사진 또는 입력 교체 가능 여부 판정 (판독 불가 또는 오류로 보류된 경우)
 */
export function canReplaceInput(ctx: CasePolicyContext, verdict?: Verdict): boolean {
  if (ctx.hasActiveJob) return false;
  if (ctx.caseStatus === "RETRY_REQUIRED") return true;
  if (verdict === "UNREADABLE") return true;
  return false;
}

export interface AutoReleaseGateParams {
  accountActive: boolean;
  consentsValid: boolean;
  privacyPass: boolean;
  criticalAmbiguity: boolean;
  problemMatch: boolean;
  answersEquivalent: boolean;
  workVerificationSupported: boolean;
  errorMatch: boolean;
  conceptAutoEnabled: boolean;
  publicSafetyPass: boolean;
  teacherBlocked: boolean;
  aiAutoReleaseEnabled: boolean;
  verdict: Verdict;
  allLinesNormal?: boolean;
}

/**
 * 자동 공개 Gate 통과 여부 검사 (상세서 §11 및 구현계획 §366)
 */
export function checkAutoReleaseGate(params: AutoReleaseGateParams): boolean {
  if (!params.accountActive) return false;
  if (!params.consentsValid) return false;
  if (!params.privacyPass) return false;
  if (params.criticalAmbiguity) return false;
  if (!params.problemMatch) return false;
  if (!params.answersEquivalent) return false;
  if (!params.workVerificationSupported) return false;
  if (!params.errorMatch) return false;
  if (!params.conceptAutoEnabled) return false;
  if (!params.publicSafetyPass) return false;
  if (params.teacherBlocked) return false;
  if (!params.aiAutoReleaseEnabled) return false;

  if (params.verdict === "CORRECT") {
    // CORRECT인 경우 모든 풀이 줄 정상 요건 추가
    if (params.allLinesNormal === false) return false;
  }

  return true;
}

/**
 * 정상 평가 시도 차감 여부 계산
 * 최초 시도이거나 유효한 판정이 확정된 시도만 차감 (실패/보류/재촬영은 차감 0)
 */
export function shouldCountAttempt(verdict: Verdict): boolean {
  return verdict === "CORRECT" || verdict === "INCORRECT";
}
