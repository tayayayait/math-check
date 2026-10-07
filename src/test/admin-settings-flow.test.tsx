import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React, { useMemo } from "react";
import { DataProvider } from "../services/data-provider";
import { DemoRepository } from "../services/demo-repository";
import { DemoSessionProvider } from "../features/auth/DemoSessionProvider";
import { AdminSettingsPage } from "../features/admin/AdminSettingsPage";

vi.mock("@tanstack/react-router", () => {
  return {
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
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

function TestWrapper({
  children,
  actorId = "usr_admin_01",
}: {
  children: React.ReactNode;
  actorId?: string;
}) {
  const repo = useMemo(() => {
    const r = new DemoRepository();
    r.setDemoSession(actorId);
    return r;
  }, [actorId]);

  return (
    <DataProvider repository={repo}>
      <DemoSessionProvider>{children}</DemoSessionProvider>
    </DataProvider>
  );
}

describe("Phase 8 - 원장/대표 운영 관리 센터 통합 테스트", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("원장 운영 관리 센터가 렌더링되고 4대 핵심 관리 탭이 제공된다", async () => {
    render(
      <TestWrapper>
        <AdminSettingsPage />
      </TestWrapper>,
    );

    // 타이틀 확인
    await waitFor(() => {
      expect(screen.getByText("원장/대표 운영 관리 센터")).toBeDefined();
    });

    // 4대 관리 탭 존재 확인
    expect(screen.getByText("계정 및 관계 설정")).toBeDefined();
    expect(screen.getByText("개인정보 및 동의 증빙")).toBeDefined();
    expect(screen.getByText("AI 운영 모니터링")).toBeDefined();
    expect(screen.getByText("진단 교정 규칙")).toBeDefined();
  });

  it("계정 및 관계 설정 탭에서 계정 목록과 신규 계정 등록 버튼이 표시된다", async () => {
    render(
      <TestWrapper>
        <AdminSettingsPage />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText("+ 신규 계정 등록")).toBeDefined();
    });

    // 학생, 교사, 학부모 등 계정 표시 확인
    expect(screen.getAllByText("김민수").length).toBeGreaterThan(0);
    expect(screen.getAllByText("박선생").length).toBeGreaterThan(0);
    expect(screen.getAllByText("김학부모").length).toBeGreaterThan(0);

    // 관계 설정 영역 확인
    expect(screen.getByText("학습 담당 및 보호자 연결 관리")).toBeDefined();
  });

  it("개인정보 및 동의 증빙 탭으로 전환 시 법정대리인 증빙 및 보관 정책이 표시된다", async () => {
    render(
      <TestWrapper>
        <AdminSettingsPage />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText("개인정보 및 동의 증빙")).toBeDefined();
    });

    // 탭 클릭 전환
    fireEvent.click(screen.getByText("개인정보 및 동의 증빙"));

    await waitFor(() => {
      expect(screen.getByText("법정대리인 동의 증빙 및 동의 현황")).toBeDefined();
    });

    // 보관 정책 안내 카드 확인
    expect(screen.getByText("손글씨 원본/정제 사진")).toBeDefined();
    expect(screen.getByText("90일 보관")).toBeDefined();
    expect(screen.getByText("365일 보관")).toBeDefined();

    // 삭제 요청 관리 영역 확인
    expect(screen.getByText("계정 탈퇴 및 개인정보 삭제 요청 처리")).toBeDefined();
  });

  it("AI 운영 모니터링 탭으로 전환 시 자동 공개 토글과 예산 게이지가 표시된다", async () => {
    render(
      <TestWrapper>
        <AdminSettingsPage />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText("AI 운영 모니터링")).toBeDefined();
    });

    // 탭 클릭 전환
    fireEvent.click(screen.getByText("AI 운영 모니터링"));

    await waitFor(() => {
      expect(screen.getByText(/AI 진단 결과 자동 공개 정책/)).toBeDefined();
    });

    // 예산 모니터링 및 경고 확인
    expect(screen.getByText("월간 AI 분석 운영 예산 모니터링 (합성 예시)")).toBeDefined();
    expect(screen.getByText(/84,000원/)).toBeDefined();

    // 단원 지원 상태 확인
    expect(screen.getByText("중1 일차방정식")).toBeDefined();
    expect(screen.getByText("✓ 자동 진단 지원")).toBeDefined();
  });

  it("진단 교정 규칙 탭으로 전환 시 등록된 규칙 목록이 렌더링된다", async () => {
    render(
      <TestWrapper>
        <AdminSettingsPage />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText("진단 교정 규칙")).toBeDefined();
    });

    // 탭 클릭 전환
    fireEvent.click(screen.getByText("진단 교정 규칙"));

    await waitFor(() => {
      expect(screen.getByText("진단 교정 규칙 및 피드백 원리 관리")).toBeDefined();
    });

    // 등록된 시드 규칙 확인
    expect(screen.getByText("이항 시 부호 반전 규칙 명시적 교정")).toBeDefined();
    expect(screen.getByText("괄호 앞 음수 계수 분배법칙 누락 교정")).toBeDefined();

    // 새 교정 규칙 등록 버튼 확인
    expect(screen.getByText("+ 새 교정 규칙 등록")).toBeDefined();
  });
});
