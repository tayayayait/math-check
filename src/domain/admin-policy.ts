/**
 * 원장/관리자 운영 설정 도메인 정책
 * domain/admin-policy.ts
 */

import type { DeletionRequestStatus } from "../contracts/admin";

/**
 * 관리번호 유효성 및 중복 검사
 */
export function validateInternalNo(
  internalNo: string,
  existingNos: string[] = [],
): { valid: boolean; reason?: string } {
  const trimmed = internalNo.trim();
  if (trimmed.length < 1 || trimmed.length > 20) {
    return { valid: false, reason: "관리번호는 1자 이상 20자 이하이어야 합니다." };
  }
  if (!/^[A-Za-z0-9-]+$/.test(trimmed)) {
    return { valid: false, reason: "관리번호는 영문, 숫자, 하이픈(-)만 사용할 수 있습니다." };
  }
  if (existingNos.includes(trimmed)) {
    return { valid: false, reason: "이미 사용 중인 관리번호입니다. 고유한 번호를 입력해 주세요." };
  }
  return { valid: true };
}

/**
 * 학생당 배정 교사 수 제한 (최대 4명)
 */
export function validateTeacherAssignmentCount(count: number): {
  valid: boolean;
  reason?: string;
} {
  if (count < 0) return { valid: false, reason: "교사 수는 0명 이상이어야 합니다." };
  if (count > 4) {
    return { valid: false, reason: "학생 한 명당 담당 교사는 최대 4명까지 배정할 수 있습니다." };
  }
  return { valid: true };
}

/**
 * 학생당 연결 보호자 수 제한 (최대 2명)
 */
export function validateParentAssignmentCount(count: number): {
  valid: boolean;
  reason?: string;
} {
  if (count < 0) return { valid: false, reason: "보호자 수는 0명 이상이어야 합니다." };
  if (count > 2) {
    return { valid: false, reason: "학생 한 명당 연결 보호자 계정은 최대 2명까지 가능합니다." };
  }
  return { valid: true };
}

/**
 * 핵심 학습 제출 가능 여부 (핵심 서비스 동의 필수)
 */
export function canSubmitSolutionWithConsent(coreLearningConsent: boolean): boolean {
  return coreLearningConsent === true;
}

/**
 * AI 자동 분석 및 결과 공개 가능 여부 (외부 AI 동의 + 운영 토글 ON)
 */
export function canAutoReleaseAiDiagnosis(
  externalAiConsent: boolean,
  aiReleaseEnabled: boolean,
): boolean {
  return externalAiConsent === true && aiReleaseEnabled === true;
}

/**
 * 학부모 리포트 정식 발행 가능 여부 (보호자 리포트 공유 동의 필수)
 */
export function canPublishParentReportWithConsent(parentReportConsent: boolean): boolean {
  return parentReportConsent === true;
}

/**
 * 월간 AI 운영 예산 임계치 평가
 */
export function evaluateBudgetThreshold(
  spentKrw: number,
  budgetKrw: number,
): {
  status: "NORMAL" | "WARNING" | "EXCEEDED";
  usageRatio: number;
  message: string;
} {
  if (budgetKrw <= 0) {
    return { status: "NORMAL", usageRatio: 0, message: "예산 한도가 설정되지 않았습니다." };
  }

  const ratio = spentKrw / budgetKrw;
  if (ratio >= 1.0) {
    return {
      status: "EXCEEDED",
      usageRatio: ratio,
      message:
        "월 예산 100%를 초과하여 신규 모의 AI 자동 분석이 중지되었습니다. 교사 수동 검토 경로로 전환됩니다.",
    };
  }
  if (ratio >= 0.8) {
    return {
      status: "WARNING",
      usageRatio: ratio,
      message: "월 예산의 80%에 도달했습니다. 사용량 모니터링이 필요합니다.",
    };
  }

  return {
    status: "NORMAL",
    usageRatio: ratio,
    message: "정상 운영 중입니다.",
  };
}

/**
 * 교정 규칙 승인 가능 여부 (개인정보 검사 PASS + 회귀 검증 PASS)
 */
export function canApproveCorrectionRule(rule: {
  privacyCheckPassed: boolean;
  regressionEvalStatus: "PASS" | "FAIL" | "PENDING";
}): { valid: boolean; reason?: string } {
  if (!rule.privacyCheckPassed) {
    return { valid: false, reason: "개인정보 보호 검사를 통과하지 못했습니다." };
  }
  if (rule.regressionEvalStatus !== "PASS") {
    return { valid: false, reason: "고정 회귀 검증 평가(PASS)를 통과해야 승인할 수 있습니다." };
  }
  return { valid: true };
}

/**
 * 계정 삭제 요청 상태 전이 검증
 */
export function canTransitionDeletionStatus(
  from: DeletionRequestStatus,
  to: DeletionRequestStatus,
): boolean {
  const allowedTransitions: Record<DeletionRequestStatus, DeletionRequestStatus[]> = {
    REQUESTED: ["BLOCKED", "FAILED"],
    BLOCKED: ["PURGING", "FAILED"],
    PURGING: ["COMPLETED", "FAILED"],
    FAILED: ["BLOCKED", "PURGING"],
    COMPLETED: [],
  };

  return allowedTransitions[from]?.includes(to) ?? false;
}

/**
 * 8자리 안전한 데모 임시 비밀번호 생성기
 */
export function generateTemporaryPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let result = "temp-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
