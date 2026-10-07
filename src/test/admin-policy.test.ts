import { describe, expect, it } from "vitest";
import {
  validateInternalNo,
  validateTeacherAssignmentCount,
  validateParentAssignmentCount,
  canSubmitSolutionWithConsent,
  canAutoReleaseAiDiagnosis,
  canPublishParentReportWithConsent,
  evaluateBudgetThreshold,
  canApproveCorrectionRule,
  canTransitionDeletionStatus,
  generateTemporaryPassword,
} from "../domain/admin-policy";

describe("Phase 8 - 원장/대표 운영 설정 도메인 정책 단위 테스트", () => {
  describe("관리번호 유효성 검사 (validateInternalNo)", () => {
    it("영문, 숫자, 하이픈 조합은 정상 승인된다", () => {
      const res = validateInternalNo("STU-2026-001", ["STU-2026-002"]);
      expect(res.valid).toBe(true);
    });

    it("특수문자나 공백이 포함되면 차단된다", () => {
      const res1 = validateInternalNo("STU 2026", []);
      expect(res1.valid).toBe(false);
      const res2 = validateInternalNo("STU_2026!", []);
      expect(res2.valid).toBe(false);
    });

    it("중복된 관리번호는 유일성 위반으로 차단된다", () => {
      const res = validateInternalNo("STU-001", ["STU-001", "STU-002"]);
      expect(res.valid).toBe(false);
      expect(res.reason).toContain("이미 사용 중인");
    });
  });

  describe("관계 수 제한 검사", () => {
    it("학생당 담당 교사는 최대 4명까지 허용된다", () => {
      expect(validateTeacherAssignmentCount(0).valid).toBe(true);
      expect(validateTeacherAssignmentCount(4).valid).toBe(true);
      expect(validateTeacherAssignmentCount(5).valid).toBe(false);
    });

    it("학생당 연결 보호자는 최대 2명까지 허용된다", () => {
      expect(validateParentAssignmentCount(0).valid).toBe(true);
      expect(validateParentAssignmentCount(2).valid).toBe(true);
      expect(validateParentAssignmentCount(3).valid).toBe(false);
    });
  });

  describe("개인정보 및 동의 게이트", () => {
    it("핵심 학습 동의가 없으면 풀이 제출이 차단된다", () => {
      expect(canSubmitSolutionWithConsent(true)).toBe(true);
      expect(canSubmitSolutionWithConsent(false)).toBe(false);
    });

    it("외부 AI 동의와 AI 릴리즈 활성화가 모두 충족되어야 자동 공개된다", () => {
      expect(canAutoReleaseAiDiagnosis(true, true)).toBe(true);
      expect(canAutoReleaseAiDiagnosis(false, true)).toBe(false);
      expect(canAutoReleaseAiDiagnosis(true, false)).toBe(false);
      expect(canAutoReleaseAiDiagnosis(false, false)).toBe(false);
    });

    it("학부모 리포트 공유 동의가 없으면 정식 발행이 차단된다", () => {
      expect(canPublishParentReportWithConsent(true)).toBe(true);
      expect(canPublishParentReportWithConsent(false)).toBe(false);
    });
  });

  describe("월간 AI 예산 임계치 평가 (evaluateBudgetThreshold)", () => {
    const budget = 100000;

    it("80% 미만 사용 시 NORMAL 상태를 반환한다", () => {
      const res = evaluateBudgetThreshold(70000, budget);
      expect(res.status).toBe("NORMAL");
    });

    it("80% 이상 사용 시 WARNING 상태를 반환한다", () => {
      const res = evaluateBudgetThreshold(85000, budget);
      expect(res.status).toBe("WARNING");
      expect(res.message).toContain("80%");
    });

    it("100% 도달 시 EXCEEDED 상태를 반환하고 분석 중지 안내를 제공한다", () => {
      const res = evaluateBudgetThreshold(105000, budget);
      expect(res.status).toBe("EXCEEDED");
      expect(res.message).toContain("중지");
    });
  });

  describe("교정 규칙 승인 자격 (canApproveCorrectionRule)", () => {
    it("개인정보 PASS 및 회귀 검증 PASS일 때만 승인 가능하다", () => {
      const res = canApproveCorrectionRule({
        privacyCheckPassed: true,
        regressionEvalStatus: "PASS",
      });
      expect(res.valid).toBe(true);
    });

    it("개인정보 보호 검사 미통과 시 승인이 차단된다", () => {
      const res = canApproveCorrectionRule({
        privacyCheckPassed: false,
        regressionEvalStatus: "PASS",
      });
      expect(res.valid).toBe(false);
      expect(res.reason).toContain("개인정보");
    });

    it("회귀 검증이 FAIL이거나 PENDING이면 승인이 차단된다", () => {
      const res1 = canApproveCorrectionRule({
        privacyCheckPassed: true,
        regressionEvalStatus: "FAIL",
      });
      expect(res1.valid).toBe(false);

      const res2 = canApproveCorrectionRule({
        privacyCheckPassed: true,
        regressionEvalStatus: "PENDING",
      });
      expect(res2.valid).toBe(false);
    });
  });

  describe("삭제 요청 상태 전이 및 임시 비밀번호 생성기", () => {
    it("삭제 요청은 REQUESTED -> BLOCKED -> PURGING -> COMPLETED 순서로 전이된다", () => {
      expect(canTransitionDeletionStatus("REQUESTED", "BLOCKED")).toBe(true);
      expect(canTransitionDeletionStatus("BLOCKED", "PURGING")).toBe(true);
      expect(canTransitionDeletionStatus("PURGING", "COMPLETED")).toBe(true);
      expect(canTransitionDeletionStatus("REQUESTED", "COMPLETED")).toBe(false);
      expect(canTransitionDeletionStatus("COMPLETED", "REQUESTED")).toBe(false);
    });

    it("임시 비밀번호는 temp-로 시작하는 8자리 문자열을 생성한다", () => {
      const pwd = generateTemporaryPassword();
      expect(pwd.startsWith("temp-")).toBe(true);
      expect(pwd.length).toBeGreaterThanOrEqual(8);
    });
  });
});
