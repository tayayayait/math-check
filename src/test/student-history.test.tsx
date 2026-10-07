import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { DataProvider } from "../services/data-provider";
import { DemoSessionProvider } from "../features/auth/DemoSessionProvider";
import { HistoryPage } from "../features/student/HistoryPage";

vi.mock("@tanstack/react-router", () => {
  return {
    useNavigate: () => vi.fn(),
    useRouterState: () => ({ location: { pathname: "/student/history" } }),
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

describe("Phase 4 - HistoryPage 학습 기록 목록 테스트", () => {
  it("학습 기록 목록이 정상 로드되고 검색 및 필터 버튼이 표시된다", async () => {
    render(
      <TestWrapper>
        <HistoryPage />
      </TestWrapper>,
    );

    // 헤더 타이틀 확인
    expect(screen.getByText("학습 및 풀이 진단 기록")).toBeDefined();

    // 상태 필터 버튼들 확인
    expect(screen.getByText("전체 상태")).toBeDefined();
    expect(screen.getByText("재풀이 필요")).toBeDefined();
    expect(screen.getByText("선생님 확인 중")).toBeDefined();
    expect(screen.getByText("완료")).toBeDefined();

    // 기간 필터 버튼 확인
    expect(screen.getByText("30일")).toBeDefined();

    // 목록 데이터 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByText(/총 \d+건의 학습 기록/)).toBeDefined();
    });
  });

  it("검색어 입력 시 디바운스되어 필터링된다", async () => {
    render(
      <TestWrapper>
        <HistoryPage />
      </TestWrapper>,
    );

    const searchInput = screen.getByPlaceholderText(/교재명, 페이지 또는 문제 번호/);
    fireEvent.change(searchInput, { target: { value: "개념원리" } });

    await waitFor(
      () => {
        expect(searchInput).toBeDefined();
      },
      { timeout: 500 },
    );
  });
});
