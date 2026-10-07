import { describe, expect, it } from "vitest";
import {
  canResubmit,
  canAskTeacher,
  canReplaceInput,
  checkAutoReleaseGate,
  shouldCountAttempt,
} from "../domain/case-policy";
import type { AutoReleaseGateParams, CasePolicyContext } from "../domain/case-policy";

describe("case-policy", () => {
  describe("canResubmit", () => {
    it("시도 횟수가 한도 미만이고 미해결 상태이면 재제출이 가능하다", () => {
      const ctx: CasePolicyContext = {
        caseStatus: "RETRY_REQUIRED",
        evaluatedCount: 2,
        extraAttemptAllowance: 0,
        hasActiveJob: false,
        helpRequested: false,
      };
      expect(canResubmit(ctx)).toBe(true);
    });

    it("기본 4회 시도를 소진하면 추가 허용이 없을 때 재제출이 차단된다", () => {
      const ctx: CasePolicyContext = {
        caseStatus: "RETRY_REQUIRED",
        evaluatedCount: 4,
        extraAttemptAllowance: 0,
        hasActiveJob: false,
        helpRequested: false,
      };
      expect(canResubmit(ctx)).toBe(false);
    });

    it("교사가 추가 허용(+1)을 부여하면 5회까지 재제출이 허용된다", () => {
      const ctx: CasePolicyContext = {
        caseStatus: "RETRY_REQUIRED",
        evaluatedCount: 4,
        extraAttemptAllowance: 1,
        hasActiveJob: false,
        helpRequested: false,
      };
      expect(canResubmit(ctx)).toBe(true);
    });

    it("진행 중인 작업(hasActiveJob)이 있거나 이미 완료/종결된 경우 재제출이 차단된다", () => {
      expect(
        canResubmit({
          caseStatus: "RETRY_REQUIRED",
          evaluatedCount: 1,
          extraAttemptAllowance: 0,
          hasActiveJob: true,
          helpRequested: false,
        }),
      ).toBe(false);

      expect(
        canResubmit({
          caseStatus: "RESOLVED",
          evaluatedCount: 1,
          extraAttemptAllowance: 0,
          hasActiveJob: false,
          helpRequested: false,
        }),
      ).toBe(false);

      expect(
        canResubmit({
          caseStatus: "TEACHER_CLOSED",
          evaluatedCount: 1,
          extraAttemptAllowance: 0,
          hasActiveJob: false,
          helpRequested: false,
        }),
      ).toBe(false);
    });
  });

  describe("canAskTeacher", () => {
    it("도움 요청을 아직 하지 않은 진행 중 케이스에서 질문이 가능하다", () => {
      const ctx: CasePolicyContext = {
        caseStatus: "RETRY_REQUIRED",
        evaluatedCount: 1,
        extraAttemptAllowance: 0,
        hasActiveJob: false,
        helpRequested: false,
      };
      expect(canAskTeacher(ctx)).toBe(true);
    });

    it("이미 도움 요청을 보냈거나 완료된 케이스에서는 질문이 불가능하다", () => {
      expect(
        canAskTeacher({
          caseStatus: "WAITING_TEACHER",
          evaluatedCount: 1,
          extraAttemptAllowance: 0,
          hasActiveJob: false,
          helpRequested: true,
        }),
      ).toBe(false);

      expect(
        canAskTeacher({
          caseStatus: "RESOLVED",
          evaluatedCount: 1,
          extraAttemptAllowance: 0,
          hasActiveJob: false,
          helpRequested: false,
        }),
      ).toBe(false);
    });
  });

  describe("canReplaceInput", () => {
    it("판독 불가(UNREADABLE)이거나 RETRY_REQUIRED일 때 입력 교체가 가능하다", () => {
      const ctx: CasePolicyContext = {
        caseStatus: "RETRY_REQUIRED",
        evaluatedCount: 1,
        extraAttemptAllowance: 0,
        hasActiveJob: false,
        helpRequested: false,
      };
      expect(canReplaceInput(ctx, "UNREADABLE")).toBe(true);
    });
  });

  describe("checkAutoReleaseGate", () => {
    const validParams: AutoReleaseGateParams = {
      accountActive: true,
      consentsValid: true,
      privacyPass: true,
      criticalAmbiguity: false,
      problemMatch: true,
      answersEquivalent: true,
      workVerificationSupported: true,
      errorMatch: true,
      conceptAutoEnabled: true,
      publicSafetyPass: true,
      teacherBlocked: false,
      aiAutoReleaseEnabled: true,
      verdict: "CORRECT",
      allLinesNormal: true,
    };

    it("모든 게이트 요건을 충족하면 자동 공개 PASS를 반환한다", () => {
      expect(checkAutoReleaseGate(validParams)).toBe(true);
    });

    it("개인정보 가림이 실패하거나 모호성이 있으면 자동 공개가 차단된다", () => {
      expect(checkAutoReleaseGate({ ...validParams, privacyPass: false })).toBe(false);
      expect(checkAutoReleaseGate({ ...validParams, criticalAmbiguity: true })).toBe(false);
    });

    it("정답 판정 시 풀이 과정 중 비정상 줄이 있으면 공개가 차단된다", () => {
      expect(checkAutoReleaseGate({ ...validParams, allLinesNormal: false })).toBe(false);
    });
  });

  describe("shouldCountAttempt", () => {
    it("정답 또는 오답 시도만 횟수를 차감하고, 판독 불가나 미정은 차감하지 않는다", () => {
      expect(shouldCountAttempt("CORRECT")).toBe(true);
      expect(shouldCountAttempt("INCORRECT")).toBe(true);
      expect(shouldCountAttempt("UNREADABLE")).toBe(false);
      expect(shouldCountAttempt("UNDETERMINED")).toBe(false);
    });
  });
});
