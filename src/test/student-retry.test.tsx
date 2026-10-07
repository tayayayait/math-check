import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { DataProvider } from "../services/data-provider";
import { DemoSessionProvider } from "../features/auth/DemoSessionProvider";
import { RetryPage } from "../features/student/RetryPage";

vi.mock("@tanstack/react-router", () => {
  return {
    useParams: () => ({ caseId: "case_01" }),
    useNavigate: () => vi.fn(),
    useRouterState: () => ({ location: { pathname: "/student/cases/case_01/retry" } }),
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-mock" data-to={to} />,
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

describe("Phase 4 - RetryPage 재풀이 제출 테스트", () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => "blob:mock-image-url");
    global.URL.revokeObjectURL = vi.fn();

    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        blob: () => Promise.resolve(new Blob(["<svg></svg>"], { type: "image/svg+xml" })),
      }),
    );
  });

  it("기존 문제 정보가 로드되고 사진 미등록 시 제출 버튼이 비활성화된다", async () => {
    render(
      <TestWrapper>
        <RetryPage />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText("문제 다시 풀기 (재풀이 제출)")).toBeDefined();
    });

    const submitBtn = screen.getByRole("button", { name: /새 풀이 진단 요청하기/ });
    expect(submitBtn).toBeDefined();
    expect(submitBtn.hasAttribute("disabled")).toBe(true);
  });
});
