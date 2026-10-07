import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { DataProvider } from "../services/data-provider";
import { DemoSessionProvider } from "../features/auth/DemoSessionProvider";
import { ReviewApprovalPage } from "../features/review/ReviewApprovalPage";
import { StudentReviewPage } from "../features/review/StudentReviewPage";

let mockReviewId = "rev_01";

vi.mock("@tanstack/react-router", () => {
  return {
    useNavigate: () => vi.fn(),
    useParams: () => ({ reviewId: mockReviewId }),
    Link: ({
      children,
      to,
      ...props
    }: {
      children: React.ReactNode;
      to: string;
      [key: string]: unknown;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <DemoSessionProvider>{children}</DemoSessionProvider>
    </DataProvider>
  );
}

describe("Phase 6 - 복습 후보 검수 및 학생 복습 풀이 통합 테스트", () => {
  describe("ReviewApprovalPage (교사 검수 및 승인)", () => {
    it("복습 문제 후보가 렌더링되고 8대 품질 검수 기준 및 승인 버튼이 표시된다", async () => {
      mockReviewId = "rev_01";
      render(
        <TestWrapper>
          <ReviewApprovalPage />
        </TestWrapper>,
      );

      // 타이틀 확인
      await waitFor(() => {
        expect(screen.getByText("맞춤 복습 문항 승인 및 품질 점검")).toBeDefined();
      });

      // 8대 체크리스트 헤더 확인
      expect(screen.getByText("복습 문항 8대 품질·적합성 검수 기준")).toBeDefined();

      // 체크리스트 주요 항목 텍스트 확인
      expect(screen.getByText("문제 조건 충분성")).toBeDefined();
      expect(screen.getByText("해의 존재 및 유일성")).toBeDefined();
      expect(screen.getByText("독립 검증 답안 일치")).toBeDefined();
      expect(screen.getByText("학년 및 단원 부합")).toBeDefined();
      expect(screen.getByText("모바일 수식 가독성")).toBeDefined();

      // 하단 최종 승인 버튼 확인
      const approveBtn = screen.getByRole("button", { name: /최종 승인 및 공개 설정/i });
      expect(approveBtn).toBeDefined();
      expect((approveBtn as HTMLButtonElement).disabled).toBe(false);
    });

    it("체크리스트 중 1개라도 해제되면 승인 버튼이 비활성화된다", async () => {
      mockReviewId = "rev_01";
      render(
        <TestWrapper>
          <ReviewApprovalPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("맞춤 복습 문항 승인 및 품질 점검")).toBeDefined();
      });

      // 첫 번째 체크박스 찾아서 클릭 해제
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBe(8);

      fireEvent.click(checkboxes[0]!);

      // 승인 버튼 비활성화 확인
      const approveBtn = screen.getByRole("button", { name: /최종 승인 및 공개 설정/i });
      expect((approveBtn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe("StudentReviewPage (학생 복습 풀이)", () => {
    it("미승인(PENDING_APPROVAL) 상태인 복습 문제는 학생에게 검수 진행 중 안내를 표시한다", async () => {
      mockReviewId = "rev_01";
      render(
        <TestWrapper>
          <StudentReviewPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("선생님의 검수가 진행 중인 문제입니다")).toBeDefined();
      });
      expect(
        screen.getByText(
          "선생님께서 문항의 난이도와 적합성을 검토하신 후 승인하시면 풀이를 시작할 수 있습니다.",
        ),
      ).toBeDefined();
    });

    it("승인 및 공개(AVAILABLE) 상태인 문제는 풀이 화면이 열리고 사진 미등록 시 제출이 비활성화된다", async () => {
      mockReviewId = "rev_03";
      render(
        <TestWrapper>
          <StudentReviewPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("유사 개념 복습 풀이")).toBeDefined();
      });

      // 제출 버튼 비활성화 확인
      const submitBtn = screen.getByRole("button", { name: /복습 풀이 제출하기/i });
      expect((submitBtn as HTMLButtonElement).disabled).toBe(true);
      expect(screen.getByText("풀이 사진을 1장 이상 등록해야 제출할 수 있습니다.")).toBeDefined();
    });
  });
});
