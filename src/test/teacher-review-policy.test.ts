import { describe, it, expect } from "vitest";
import {
  validateCorrectionReason,
  validateCloseReason,
  canGrantExtraAttempt,
  validateExtraAttemptReason,
} from "../domain/teacher-review-policy";

describe("Phase 5 - 교사 검수 및 지도 관리 정책 단위 테스트", () => {
  describe("수정 사유 검증 (10~500자)", () => {
    it("10자 미만의 수정 사유는 거절해야 한다", () => {
      const res = validateCorrectionReason("짧은 사유");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("최소 10자 이상");
    });

    it("10자 이상의 유효한 사유는 승인해야 한다", () => {
      const res = validateCorrectionReason("부호 오류가 아니라 이항 자체를 누락한 풀이임");
      expect(res.valid).toBe(true);
    });

    it("500자를 초과한 사유는 거절해야 한다", () => {
      const longReason = "a".repeat(501);
      const res = validateCorrectionReason(longReason);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("최대 500자");
    });
  });

  describe("직접 지도 종결 사유 검증 (20~1000자)", () => {
    it("20자 미만의 종결 설명은 거절해야 한다", () => {
      const res = validateCloseReason("교실에서 직접 지도 완료함");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("최소 20자 이상");
    });

    it("20자 이상의 충분한 지도 설명은 승인해야 한다", () => {
      const res = validateCloseReason(
        "방과 후 개별 면담을 통해 일차방정식 이항 원리를 직접 지도하여 학생이 완전히 이해함을 확인했습니다.",
      );
      expect(res.valid).toBe(true);
    });
  });

  describe("추가 재풀이 기회 허용 검증 (최대 2회)", () => {
    it("시도 횟수가 한도(4회)에 도달하지 않았으면 추가 기회를 부여할 수 없다", () => {
      // 2회 시도 상태
      expect(canGrantExtraAttempt(2, 4, 0)).toBe(false);
    });

    it("한도(4회)에 도달했고 추가 기회가 0회일 때 추가 기회 1회 부여가 가능하다", () => {
      expect(canGrantExtraAttempt(4, 4, 0)).toBe(true);
    });

    it("이미 추가 기회가 2회(최대치) 소진된 경우 더 이상 추가 기회를 부여할 수 없다", () => {
      expect(canGrantExtraAttempt(6, 4, 2)).toBe(false);
    });

    it("추가 기회 부여 사유는 10자 이상이어야 한다", () => {
      expect(validateExtraAttemptReason("기회 줌").valid).toBe(false);
      expect(
        validateExtraAttemptReason("학생이 개념을 다시 복습하고 재도전을 희망하여 기회 부여함")
          .valid,
      ).toBe(true);
    });
  });
});
