import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { DataProvider } from "../services/data-provider";
import { DemoSessionProvider } from "../features/auth/DemoSessionProvider";
import { TeacherDashboardPage } from "../features/teacher/TeacherDashboardPage";
import { StudentListPage } from "../features/teacher/StudentListPage";
import { DiagnosisReviewForm } from "../features/teacher/DiagnosisReviewForm";
import type { TeacherCaseDto } from "../contracts/dto";

vi.mock("@tanstack/react-router", () => {
  return {
    useNavigate: () => vi.fn(),
    useRouterState: () => ({ location: { pathname: "/teacher" } }),
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

describe("Phase 5 - 교사 대시보드 및 검수 흐름 테스트", () => {
  describe("TeacherDashboardPage", () => {
    it("교사 대시보드가 정상 렌더링되고 4대 핵심 지표 카드가 표시된다", async () => {
      render(
        <TestWrapper>
          <TeacherDashboardPage />
        </TestWrapper>,
      );

      // 타이틀 확인
      expect(screen.getByText("선생님 업무 대시보드")).toBeDefined();
      expect(screen.getByText("오늘 검토할 학생 진단 및 지도 현황")).toBeDefined();

      // 핵심 지표 카드 타이틀 확인
      expect(screen.getByText("교사 확인 대기")).toBeDefined();
      expect(screen.getByText("설명 필요 (질문 접수)")).toBeDefined();
      expect(screen.getByText("재풀이 진행 건")).toBeDefined();
      expect(screen.getByText("주요 취약 개념")).toBeDefined();

      // 우선순위 큐 섹션 확인
      expect(screen.getByText("최우선 지도 및 검수 대상 큐")).toBeDefined();
    });
  });

  describe("StudentListPage", () => {
    it("담당 학생 목록이 정상 렌더링된다", async () => {
      render(
        <TestWrapper>
          <StudentListPage />
        </TestWrapper>,
      );

      expect(screen.getByText("담당 학생 관리")).toBeDefined();
      expect(screen.getByPlaceholderText(/학생 이름 또는 로그인 ID/)).toBeDefined();

      // 학생 데이터 로드 대기
      await waitFor(() => {
        expect(screen.getByText(/총 \d+명 관리 중/)).toBeDefined();
      });
    });
  });

  describe("DiagnosisReviewForm", () => {
    const dummyCase: TeacherCaseDto = {
      caseId: "case_01",
      learnerId: "usr_student_01",
      kind: "ORIGINAL",
      sourceCaseId: null,
      currentAttemptId: "att_01_1",
      inputRevision: 1,
      resultVersion: 1,
      bookTitle: "개념원리",
      page: 112,
      problemNo: "03",
      caseStatus: "RETRY_REQUIRED",
      verdict: "INCORRECT",
      studentMessage: "부호 변경 오류",
      errorRegion: {
        lineId: "L02",
        bbox: { x: 0.1, y: 0.2, w: 0.8, h: 0.2 },
      },
      recognizedLines: [
        { lineId: "L01", text: "3x + 5 = 14" },
        { lineId: "L02", text: "3x = 14 + 5" },
      ],
      revealedHints: [],
      canRevealNextHint: true,
      canResubmit: true,
      canAskTeacher: true,
      revisionNotice: null,
      problemPhotoRef: {
        clientPhotoId: "p1",
        purpose: "PROBLEM",
        order: 0,
        width: 800,
        height: 600,
        mime: "image/png",
        bytes: 1024,
        editedRevision: 1,
      },
      workPhotoRefs: [],
      evaluatedCount: 1,
      maxEvaluatedCount: 4,
      extraAttemptAllowance: 0,
      helpRequested: false,
      allHints: ["힌트 1", "힌트 2", "힌트 3"],
      auditHistory: [],
      createdAt: "2026-10-07T00:00:00Z",
      updatedAt: "2026-10-07T00:00:00Z",
    };

    it("확인만 저장 버튼 클릭 시 onConfirmOnly 콜백이 정상 호출된다", async () => {
      const handleConfirm = vi.fn().mockResolvedValue(undefined);

      render(
        <DiagnosisReviewForm
          caseData={dummyCase}
          onConfirmOnly={handleConfirm}
          onSaveCorrection={vi.fn()}
          onCloseTeacher={vi.fn()}
          onGrantExtraAttempt={vi.fn()}
          isSubmitting={false}
        />,
      );

      const confirmBtn = screen.getByRole("button", { name: "변경 없이 확인만 저장" });
      fireEvent.click(confirmBtn);

      expect(handleConfirm).toHaveBeenCalled();
    });
  });
});
