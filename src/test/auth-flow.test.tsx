import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { DataProvider } from "../services/data-provider";
import { DemoSessionProvider } from "../features/auth/DemoSessionProvider";
import { LoginPage } from "../features/auth/LoginPage";
import { OnboardingPage } from "../features/auth/OnboardingPage";
import { AccountPage } from "../features/auth/AccountPage";
import { RoleGuard } from "../features/auth/role-guard";
import { DemoControls } from "../components/app/DemoControls";

vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useRouterState: () => ({ location: { pathname: "/test" } }),
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

describe("Phase 2 - 인증 및 레이아웃 흐름", () => {
  describe("LoginPage", () => {
    it("학생 로그인과 교사/학부모 로그인 탭이 올바르게 전환된다", () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>,
      );

      // 기본 학생 로그인 탭
      expect(screen.getByText("학생 로그인")).toBeDefined();
      expect(screen.getByLabelText(/학생 아이디/)).toBeDefined();

      // 교사/학부모 탭 클릭
      fireEvent.click(screen.getByText("교사 / 학부모"));
      expect(screen.getByLabelText(/이메일 주소/)).toBeDefined();
    });

    it("검수용 원클릭 데모 로그인 버튼들이 제공된다", () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>,
      );

      expect(screen.getByText("학생 A (김민수)")).toBeDefined();
      expect(screen.getByText("교사 (강선생)")).toBeDefined();
      expect(screen.getByText("학부모 (김학부모)")).toBeDefined();
      expect(screen.getByText("대표 (최대표)")).toBeDefined();
    });
  });

  describe("RoleGuard", () => {
    it("학생 역할로 허용된 페이지에 접근하면 콘텐츠가 정상 렌더링된다", async () => {
      render(
        <TestWrapper>
          <RoleGuard allowedRoles={["STUDENT"]}>
            <div data-testid="protected-content">인증된 콘텐츠</div>
          </RoleGuard>
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("protected-content")).toBeDefined();
      });
    });

    it("허용되지 않은 역할(예: TEACHER 전용에 STUDENT가 접근)일 경우 403 에러 상태가 표시된다", async () => {
      render(
        <TestWrapper>
          <RoleGuard allowedRoles={["TEACHER"]}>
            <div>선생님 콘텐츠</div>
          </RoleGuard>
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("403 ERROR")).toBeDefined();
        expect(screen.getByText("접근이 제한된 페이지입니다")).toBeDefined();
      });
    });
  });

  describe("OnboardingPage", () => {
    it("초기 임시 비밀번호 변경 폼이 렌더링된다", () => {
      render(
        <TestWrapper>
          <OnboardingPage />
        </TestWrapper>,
      );

      expect(screen.getByText("임시 비밀번호 변경")).toBeDefined();
      expect(screen.getByLabelText(/현재 임시 비밀번호/)).toBeDefined();
      expect(screen.getAllByLabelText(/새 비밀번호/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("AccountPage", () => {
    it("현재 로그인된 계정 정보와 비밀번호 변경 양식이 표시된다", async () => {
      render(
        <TestWrapper>
          <AccountPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("김민수")).toBeDefined();
        expect(screen.getAllByText("비밀번호 변경").length).toBeGreaterThan(0);
        expect(screen.getByText("로그아웃")).toBeDefined();
      });
    });
  });

  describe("DemoControls", () => {
    it("데모 빠른 역할 전환 바와 초기화 버튼이 렌더링된다", async () => {
      render(
        <TestWrapper>
          <DemoControls />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText(/데모 역할 빠른 전환/)).toBeDefined();
        expect(screen.getByText("초기화")).toBeDefined();
      });
    });
  });
});
