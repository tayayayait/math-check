import { describe, expect, it } from "vitest";
import {
  validateReportDateRange,
  validateTeacherComment,
  validateHomeQuestions,
  canPublishReport,
  canWithdrawReport,
  canEditReportDraft,
} from "../domain/report-policy";
import { getSeoulTodayString } from "../domain/seoul-date";

describe("Phase 7 - 리포트 발행 및 품질 정책 단위 테스트", () => {
  describe("validateReportDateRange", () => {
    it("90일 이내이고 오늘 이전인 유효한 기간은 통과한다", () => {
      const today = getSeoulTodayString();
      const res = validateReportDateRange("2026-09-01", today);
      expect(res.valid).toBe(true);
    });

    it("시작일이 종료일보다 늦으면 실패한다", () => {
      const res = validateReportDateRange("2026-10-05", "2026-10-01");
      expect(res.valid).toBe(false);
      expect(res.reason).toContain("시작일이 종료일보다 늦을 수 없습니다");
    });

    it("기간이 90일을 초과하면 실패한다", () => {
      const res = validateReportDateRange("2026-05-01", "2026-09-01");
      expect(res.valid).toBe(false);
      expect(res.reason).toContain("최대 90일");
    });
  });

  describe("validateTeacherComment", () => {
    it("20자 이상의 건설적인 총평은 유효하다", () => {
      const comment =
        "학생이 일차방정식의 이항 개념을 잘 이해하고 있으며, 실수를 줄이기 위해 차근차근 풀이 과정을 작성하고 있습니다.";
      const res = validateTeacherComment(comment);
      expect(res.valid).toBe(true);
    });

    it("20자 미만인 경우 실패한다", () => {
      const res = validateTeacherComment("열심히 했습니다.");
      expect(res.valid).toBe(false);
      expect(res.reason).toContain("최소 20자 이상");
    });

    it("순위 또는 평균 관련 금지 표현이 포함되면 차단된다", () => {
      const commentWithRank =
        "학생은 반에서 등수가 높은 편이며 학원 평균을 훌륭하게 상회하고 있습니다.";
      const res = validateTeacherComment(commentWithRank);
      expect(res.valid).toBe(false);
      expect(res.reason).toContain("순위, 학원 평균 또는 능력 단정");
    });
  });

  describe("validateHomeQuestions", () => {
    it("1~3개의 10자 이상 질문은 유효하다", () => {
      const questions = [
        "오늘 푼 문제 중 가장 흥미로웠던 방정식은 무엇이었나요?",
        "이항할 때 부호를 왜 바꾸어야 하는지 부모님께 한번 설명해 볼 수 있을까요?",
      ];
      const res = validateHomeQuestions(questions);
      expect(res.valid).toBe(true);
    });

    it("질문이 0개이거나 3개를 초과하면 실패한다", () => {
      expect(validateHomeQuestions([]).valid).toBe(false);
      expect(
        validateHomeQuestions([
          "질문 1111111111",
          "질문 2222222222",
          "질문 3333333333",
          "질문 4444444444",
        ]).valid,
      ).toBe(false);
    });

    it("질문이 10자 미만이면 실패한다", () => {
      const res = validateHomeQuestions(["짧은 질문?"]);
      expect(res.valid).toBe(false);
      expect(res.reason).toContain("최소 10자 이상");
    });
  });

  describe("canPublishReport and canWithdrawReport", () => {
    it("DRAFT 상태이고 유효한 총평과 질문이 있으면 발행 가능하다", () => {
      const comment = "학생이 차근차근 노력하여 일차방정식 개념을 정답까지 잘 풀어냈습니다.";
      const questions = ["집에서 이항 원리를 설명해 보는 시간을 가져보세요."];
      expect(canPublishReport("DRAFT", comment, questions)).toBe(true);
    });

    it("PUBLISHED 상태인 리포트만 수동 회수가 가능하다", () => {
      expect(canWithdrawReport("PUBLISHED")).toBe(true);
      expect(canWithdrawReport("DRAFT")).toBe(false);
      expect(canWithdrawReport("WITHDRAWN")).toBe(false);
    });

    it("REQUESTED 또는 DRAFT 상태에서만 초안 수정이 가능하다", () => {
      expect(canEditReportDraft("REQUESTED")).toBe(true);
      expect(canEditReportDraft("DRAFT")).toBe(true);
      expect(canEditReportDraft("PUBLISHED")).toBe(false);
    });
  });
});
