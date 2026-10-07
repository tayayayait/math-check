import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React, { useMemo } from "react";
import { DataProvider } from "../services/data-provider";
import { DemoRepository } from "../services/demo-repository";
import { DemoSessionProvider } from "../features/auth/DemoSessionProvider";
import { TeacherReportListPage } from "../features/report/TeacherReportListPage";
import { ReportEditorPage } from "../features/report/ReportEditorPage";
import { ParentHomePage } from "../features/report/ParentHomePage";
import { ParentReportPage } from "../features/report/ParentReportPage";

let mockReportId = "rep_01";

vi.mock("@tanstack/react-router", () => {
  return {
    useNavigate: () => vi.fn(),
    useParams: () => ({ reportId: mockReportId }),
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
  actorId = "usr_teacher_01",
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

describe("Phase 7 - 리포트 요청, 초안 편집, 발행, 보호자 열람 및 인쇄 흐름", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.print = vi.fn();
  });

  describe("TeacherReportListPage (교사 리포트 관리)", () => {
    it("교사 리포트 관리 페이지가 렌더링되고 4대 탭 및 리포트 목록이 표시된다", async () => {
      render(
        <TestWrapper actorId="usr_teacher_01">
          <TeacherReportListPage />
        </TestWrapper>,
      );

      // 타이틀 확인
      await waitFor(() => {
        expect(screen.getByText("학습 분석 리포트 관리")).toBeDefined();
      });

      // 4대 탭 존재 확인
      expect(screen.getByText(/요청 대기/)).toBeDefined();
      expect(screen.getByText(/작성 중인 초안/)).toBeDefined();
      expect(screen.getByText(/정식 발행 완료/)).toBeDefined();
      expect(screen.getByText(/회수 이력/)).toBeDefined();

      // 새 리포트 수기 등록 버튼 확인
      expect(screen.getByText("+ 구두/유선 요청 수기 등록")).toBeDefined();
    });
  });

  describe("ReportEditorPage (교사 리포트 편집 및 발행)", () => {
    it("초안 리포트가 정상 로드되고 교사 총평 및 가정 질문 입력 폼이 제공된다", async () => {
      mockReportId = "rep_01";
      render(
        <TestWrapper actorId="usr_teacher_01">
          <ReportEditorPage />
        </TestWrapper>,
      );

      // 로드 대기 및 헤더 확인
      await waitFor(() => {
        expect(screen.getByText(/학습 분석 리포트 작성/)).toBeDefined();
      });

      // 교사 총평 및 가정 연계 질문 섹션
      expect(screen.getByText(/선생님 학습 성장 총평/)).toBeDefined();
      expect(screen.getByText(/가정 연계 대화 질문/)).toBeDefined();

      // 버튼 확인
      expect(screen.getByText("초안 임시 저장")).toBeDefined();
      expect(screen.getByText("정식 발행하기")).toBeDefined();
    });
  });

  describe("ParentHomePage (보호자 홈)", () => {
    it("보호자 홈이 정상 렌더링되고 자녀 정보와 리포트 요청 버튼이 표시된다", async () => {
      render(
        <TestWrapper actorId="usr_parent_01">
          <ParentHomePage />
        </TestWrapper>,
      );

      // 타이틀 확인
      await waitFor(() => {
        expect(screen.getByText("자녀 수학 학습 리포트")).toBeDefined();
      });

      // 대상 자녀 확인
      expect(screen.getByText("김민수")).toBeDefined();

      // 새 리포트 요청 버튼
      expect(screen.getByText("+ 새 리포트 요청")).toBeDefined();

      // 발행된 리포트 섹션 헤더
      expect(screen.getByText(/발행된 학습 분석 리포트/)).toBeDefined();
    });
  });

  describe("ParentReportPage (보호자 리포트 열람 및 인쇄)", () => {
    it("발행된 리포트 상세가 로드되고 3대 지표, 총평 및 인쇄 버튼이 표시된다", async () => {
      mockReportId = "rep_02";
      const printSpy = vi.fn();
      window.print = printSpy;

      render(
        <TestWrapper actorId="usr_parent_01">
          <ParentReportPage />
        </TestWrapper>,
      );

      // 로드 완료 및 타이틀 확인
      await waitFor(() => {
        expect(screen.getByText("수학 손글씨 풀이 AI 진단 학습 분석 리포트")).toBeDefined();
      });

      // 핵심 학습 지표 확인
      expect(screen.getByText("핵심 학습 성취도 지표")).toBeDefined();
      expect(screen.getByText("확정 분석 문제 수")).toBeDefined();
      expect(screen.getByText("최초 정답률")).toBeDefined();
      expect(screen.getByText("재풀이 완료율")).toBeDefined();

      // 인쇄 버튼 확인 및 클릭 동작
      const printButton = screen.getByText("리포트 인쇄 / PDF 저장");
      expect(printButton).toBeDefined();
      fireEvent.click(printButton);

      expect(printSpy).toHaveBeenCalled();
    });
  });
});
