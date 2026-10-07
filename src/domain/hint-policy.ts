/**
 * 힌트 공개 순차 게이트 및 정책
 * domain/hint-policy.ts
 */

import type { Verdict } from "../contracts/domain";
import { DEMO_LIMITS } from "../contracts/limits";

export interface HintPolicyContext {
  verdict: Verdict;
  currentRevealedLevel: number;
  totalAvailableHints: number;
  isLatestAttempt: boolean;
  helpRequested: boolean;
  isStaleResult: boolean;
}

/**
 * 다음 단계 힌트 열람 가능 여부
 */
export function canRevealNextHint(ctx: HintPolicyContext): boolean {
  if (ctx.isStaleResult) return false;
  if (!ctx.isLatestAttempt) return false;
  if (ctx.helpRequested) return false;
  if (ctx.verdict !== "INCORRECT") return false;
  if (ctx.currentRevealedLevel >= DEMO_LIMITS.MAX_HINT_LEVEL) return false;
  if (ctx.currentRevealedLevel >= ctx.totalAvailableHints) return false;

  return true;
}

export interface ValidateHintRequestResult {
  valid: boolean;
  reason?: string;
}

/**
 * 힌트 요청 유효성 및 순차 단계 검증
 */
export function validateHintRequest(
  ctx: HintPolicyContext,
  requestedLevel: number,
): ValidateHintRequestResult {
  if (ctx.isStaleResult) {
    return { valid: false, reason: "이전 버전의 진단 결과이므로 힌트를 요청할 수 없습니다." };
  }
  if (!ctx.isLatestAttempt) {
    return { valid: false, reason: "최신 시도 결과에서만 힌트를 요청할 수 있습니다." };
  }
  if (ctx.helpRequested) {
    return {
      valid: false,
      reason: "선생님께 확인을 요청한 상태에서는 추가 힌트가 공개되지 않습니다.",
    };
  }
  if (ctx.verdict !== "INCORRECT") {
    return { valid: false, reason: "오답 진단 시에만 힌트를 열람할 수 있습니다." };
  }
  if (requestedLevel < 1 || requestedLevel > DEMO_LIMITS.MAX_HINT_LEVEL) {
    return {
      valid: false,
      reason: `힌트는 1~${DEMO_LIMITS.MAX_HINT_LEVEL}단계까지만 요청 가능합니다.`,
    };
  }
  if (requestedLevel > ctx.totalAvailableHints) {
    return { valid: false, reason: "더 이상 제공할 힌트가 없습니다." };
  }

  // 순차 열람 검증 (1 -> 2 -> 3)
  if (requestedLevel !== ctx.currentRevealedLevel + 1) {
    return {
      valid: false,
      reason: `이전 단계(${ctx.currentRevealedLevel}단계) 힌트를 먼저 확인해야 합니다.`,
    };
  }

  return { valid: true };
}
