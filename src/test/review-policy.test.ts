import { describe, expect, it } from "vitest";
import {
  canCreateReviewCandidate,
  validateReviewChecklist,
  canApproveReviewItem,
  canStartReviewItem,
  validateReviewCandidateLimits,
} from "../domain/review-policy";
import { DEFAULT_REVIEW_CHECKLIST } from "../contracts/review-item";

describe("Phase 6 - 복습 문제 관리 정책 단위 테스트", () => {
  describe("canCreateReviewCandidate", () => {
    it("ORIGINAL 문제이고 최초 오답이 있었으며 후보가 3개 미만이면 생성이 가능하다", () => {
      expect(canCreateReviewCandidate("ORIGINAL", 0, "INCORRECT")).toBe(true);
      expect(canCreateReviewCandidate("ORIGINAL", 2, "INCORRECT")).toBe(true);
    });

    it("REVIEW 문제 자체에서는 복습 후보를 재귀적으로 추가 생성하지 않는다", () => {
      expect(canCreateReviewCandidate("REVIEW", 0, "INCORRECT")).toBe(false);
    });

    it("최초 시도에서 정답(CORRECT)인 문제는 복습 후보를 만들지 않는다", () => {
      expect(canCreateReviewCandidate("ORIGINAL", 0, "CORRECT")).toBe(false);
    });

    it("후보가 이미 3개 이상이면 추가 생성이 차단된다", () => {
      expect(canCreateReviewCandidate("ORIGINAL", 3, "INCORRECT")).toBe(false);
      expect(canCreateReviewCandidate("ORIGINAL", 4, "INCORRECT")).toBe(false);
    });
  });

  describe("validateReviewChecklist", () => {
    it("8개 항목이 모두 true일 때만 true를 반환한다", () => {
      expect(validateReviewChecklist(DEFAULT_REVIEW_CHECKLIST)).toBe(true);
    });

    it("8개 중 하나라도 false이면 false를 반환한다", () => {
      const invalid = { ...DEFAULT_REVIEW_CHECKLIST, noAnswerLeakage: false };
      expect(validateReviewChecklist(invalid)).toBe(false);

      const invalid2 = { ...DEFAULT_REVIEW_CHECKLIST, mobileMathLegibility: false };
      expect(validateReviewChecklist(invalid2)).toBe(false);
    });
  });

  describe("canApproveReviewItem", () => {
    it("PENDING_APPROVAL 상태, validationStatus PASS, 8개 체크리스트 통과 시 승인 가능하다", () => {
      expect(canApproveReviewItem("PENDING_APPROVAL", DEFAULT_REVIEW_CHECKLIST, "PASS")).toBe(true);
    });

    it("이미 APPROVED 또는 REJECTED 상태이면 승인할 수 없다", () => {
      expect(canApproveReviewItem("APPROVED", DEFAULT_REVIEW_CHECKLIST, "PASS")).toBe(false);
      expect(canApproveReviewItem("REJECTED", DEFAULT_REVIEW_CHECKLIST, "PASS")).toBe(false);
    });

    it("독립 검증이 FAIL 또는 PENDING이면 승인할 수 없다", () => {
      expect(canApproveReviewItem("PENDING_APPROVAL", DEFAULT_REVIEW_CHECKLIST, "FAIL")).toBe(
        false,
      );
      expect(canApproveReviewItem("PENDING_APPROVAL", DEFAULT_REVIEW_CHECKLIST, "PENDING")).toBe(
        false,
      );
    });

    it("체크리스트 중 1개라도 불합격이면 승인할 수 없다", () => {
      const incomplete = { ...DEFAULT_REVIEW_CHECKLIST, sufficientConditions: false };
      expect(canApproveReviewItem("PENDING_APPROVAL", incomplete, "PASS")).toBe(false);
    });
  });

  describe("canStartReviewItem", () => {
    it("복습이 APPROVED/AVAILABLE이고 원문이 RESOLVED 또는 TEACHER_CLOSED이면 학생이 풀이를 시작할 수 있다", () => {
      expect(canStartReviewItem("AVAILABLE", "RESOLVED")).toBe(true);
      expect(canStartReviewItem("AVAILABLE", "TEACHER_CLOSED")).toBe(true);
      expect(canStartReviewItem("APPROVED", "RESOLVED")).toBe(true);
    });

    it("복습이 승인(APPROVED)되었더라도 원문이 미완료(RETRY_REQUIRED, WAITING_TEACHER)이면 시작할 수 없다", () => {
      expect(canStartReviewItem("AVAILABLE", "RETRY_REQUIRED")).toBe(false);
      expect(canStartReviewItem("AVAILABLE", "WAITING_TEACHER")).toBe(false);
      expect(canStartReviewItem("APPROVED", "PROCESSING")).toBe(false);
    });

    it("복습이 PENDING_APPROVAL 또는 REJECTED 상태이면 시작할 수 없다", () => {
      expect(canStartReviewItem("PENDING_APPROVAL", "RESOLVED")).toBe(false);
      expect(canStartReviewItem("REJECTED", "RESOLVED")).toBe(false);
    });
  });

  describe("validateReviewCandidateLimits", () => {
    it("정상 범위의 문제 텍스트는 유효하다", () => {
      const result = validateReviewCandidateLimits("일차방정식 $2x + 3 = 7$ 의 해를 구하시오.");
      expect(result.valid).toBe(true);
    });

    it("본문이 5자 미만이면 유효하지 않다", () => {
      const result = validateReviewCandidateLimits("풀기");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("최소 5자 이상");
    });

    it("수식 개수가 10개를 초과하면 차단된다", () => {
      const excessive = "$1$ $2$ $3$ $4$ $5$ $6$ $7$ $8$ $9$ $10$ $11$";
      const result = validateReviewCandidateLimits(excessive);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("한도(10개)를 초과");
    });
  });
});
