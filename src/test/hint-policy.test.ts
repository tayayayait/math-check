import { describe, expect, it } from "vitest";
import {
  canRevealNextHint,
  validateHintRequest,
  type HintPolicyContext,
} from "../domain/hint-policy";

describe("hint-policy", () => {
  const baseCtx: HintPolicyContext = {
    verdict: "INCORRECT",
    currentRevealedLevel: 0,
    totalAvailableHints: 3,
    isLatestAttempt: true,
    helpRequested: false,
    isStaleResult: false,
  };

  describe("canRevealNextHint", () => {
    it("오답이고 미공개 힌트가 남아있을 때 열람 가능하다", () => {
      expect(canRevealNextHint(baseCtx)).toBe(true);
    });

    it("정답(CORRECT)인 경우 힌트를 열람할 수 없다", () => {
      expect(canRevealNextHint({ ...baseCtx, verdict: "CORRECT" })).toBe(false);
    });

    it("구버전(stale) 결과이거나 교사 확인 대기(helpRequested) 중이면 열람할 수 없다", () => {
      expect(canRevealNextHint({ ...baseCtx, isStaleResult: true })).toBe(false);
      expect(canRevealNextHint({ ...baseCtx, helpRequested: true })).toBe(false);
    });

    it("이미 최대 레벨(3)까지 모두 공개되었으면 추가 열람이 불가능하다", () => {
      expect(canRevealNextHint({ ...baseCtx, currentRevealedLevel: 3 })).toBe(false);
    });
  });

  describe("validateHintRequest", () => {
    it("1단계를 먼저 요청하면 유효하다", () => {
      const res = validateHintRequest(baseCtx, 1);
      expect(res.valid).toBe(true);
    });

    it("1단계를 건너뛰고 2단계나 3단계를 바로 요청하면 거절된다", () => {
      const res2 = validateHintRequest(baseCtx, 2);
      expect(res2.valid).toBe(false);
      expect(res2.reason).toContain("이전 단계");

      const res3 = validateHintRequest(baseCtx, 3);
      expect(res3.valid).toBe(false);
      expect(res3.reason).toContain("이전 단계");
    });

    it("1단계가 열린 후 2단계 요청은 허용된다", () => {
      const res = validateHintRequest({ ...baseCtx, currentRevealedLevel: 1 }, 2);
      expect(res.valid).toBe(true);
    });

    it("허용 범위(1~3)를 벗어난 레벨 요청은 거절된다", () => {
      const res0 = validateHintRequest(baseCtx, 0);
      expect(res0.valid).toBe(false);

      const res4 = validateHintRequest({ ...baseCtx, currentRevealedLevel: 3 }, 4);
      expect(res4.valid).toBe(false);
    });
  });
});
