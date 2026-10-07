import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { DataProvider } from "../services/data-provider";
import { DemoSessionProvider } from "../features/auth/DemoSessionProvider";
import { StudentHomePage } from "../features/student/StudentHomePage";
import { SubmissionWizard } from "../features/student/SubmissionWizard";
import { SubmissionPage } from "../features/student/SubmissionPage";
import { ProblemMetadataForm } from "../features/student/ProblemMetadataForm";
import { SubmissionConfirm } from "../features/student/SubmissionConfirm";
import type { PhotoDraftItem } from "../features/student/PhotoPicker";

vi.mock("@tanstack/react-router", () => {
  return {
    useNavigate: () => vi.fn(),
    useRouterState: () => ({ location: { pathname: "/student" } }),
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

describe("Phase 3 - 학생 홈 및 제출 위저드 테스트", () => {
  beforeEach(() => {
    // JSDOM 환경 URL 및 fetch 모킹
    global.URL.createObjectURL = vi.fn(() => "blob:mock-image-url");
    global.URL.revokeObjectURL = vi.fn();

    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        blob: () => Promise.resolve(new Blob(["<svg></svg>"], { type: "image/svg+xml" })),
      }),
    );
  });

  describe("StudentHomePage", () => {
    it("학생 대시보드가 정상 렌더링되고 환영 문구와 카드 영역이 노출된다", async () => {
      render(
        <TestWrapper>
          <StudentHomePage />
        </TestWrapper>,
      );

      // 환영 메시지
      await waitFor(() => {
        expect(screen.getByText(/학생, 환영해요!|안녕하세요, 학생!/)).toBeDefined();
      });

      // 진행 중인 풀이 진단 섹션 헤더
      expect(screen.getByText("진행 중인 풀이 진단")).toBeDefined();
      expect(screen.getByText("최근 완료된 문제")).toBeDefined();
    });
  });

  describe("ProblemMetadataForm", () => {
    it("교재명, 페이지, 문제번호 입력값을 정상 변경하고 에러 메시지를 표시한다", () => {
      const metadata = {
        gradeLevel: 7,
        unitId: "M1_LINEAR_EQUATIONS",
        bookTitle: "개념원리",
        page: 45 as number | "",
        problemNo: "10",
      };
      const handleChange = vi.fn();

      render(
        <ProblemMetadataForm
          metadata={metadata}
          onChange={handleChange}
          errors={{ bookTitle: "교재명을 입력해 주세요." }}
        />,
      );

      // 교재명 오류 메시지 노출 확인
      expect(screen.getByText("교재명을 입력해 주세요.")).toBeDefined();

      // 학년 라벨 표시 확인
      expect(screen.getByText("중학교 1학년")).toBeDefined();

      // 입력 변경 테스트
      const pageInput = screen.getByLabelText(/페이지\(쪽\)/);
      fireEvent.change(pageInput, { target: { value: "50" } });
      expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ page: 50 }));
    });
  });

  describe("SubmissionConfirm", () => {
    const dummyProblem: PhotoDraftItem = {
      id: "p1",
      purpose: "PROBLEM",
      file: new File(["dummy"], "problem.jpg", { type: "image/jpeg" }),
      previewUrl: "blob:problem",
      width: 1200,
      height: 900,
      bytes: 1024,
      mime: "image/jpeg",
      editedRevision: 1,
    };

    const dummyWork: PhotoDraftItem = {
      id: "w1",
      purpose: "WORK",
      file: new File(["dummy"], "work.jpg", { type: "image/jpeg" }),
      previewUrl: "blob:work",
      width: 1200,
      height: 1600,
      bytes: 2048,
      mime: "image/jpeg",
      editedRevision: 1,
    };

    const dummyMeta = {
      gradeLevel: 7,
      unitId: "M1_LINEAR_EQUATIONS",
      bookTitle: "쎈 중등수학",
      page: 30,
      problemNo: "5",
    };

    it("두 개의 확인 체크박스가 모두 선택되어야 최종 제출 버튼이 활성화된다", () => {
      const handleSubmit = vi.fn();
      const handlePrivacyChange = vi.fn();
      const handleLegibilityChange = vi.fn();

      const { rerender } = render(
        <SubmissionConfirm
          problemPhoto={dummyProblem}
          workPhotos={[dummyWork]}
          metadata={dummyMeta}
          privacyChecked={false}
          legibilityChecked={false}
          onPrivacyCheckedChange={handlePrivacyChange}
          onLegibilityCheckedChange={handleLegibilityChange}
          onSubmit={handleSubmit}
          onBackToEdit={vi.fn()}
          isSubmitting={false}
        />,
      );

      // 미선택 상태: 버튼 비활성화
      const submitBtn = screen.getByRole("button", {
        name: /AI 진단 요청 접수하기/,
      });
      expect(submitBtn).toBeDefined();
      expect(submitBtn.hasAttribute("disabled")).toBe(true);

      // 1개만 선택된 상태
      rerender(
        <SubmissionConfirm
          problemPhoto={dummyProblem}
          workPhotos={[dummyWork]}
          metadata={dummyMeta}
          privacyChecked={true}
          legibilityChecked={false}
          onPrivacyCheckedChange={handlePrivacyChange}
          onLegibilityCheckedChange={handleLegibilityChange}
          onSubmit={handleSubmit}
          onBackToEdit={vi.fn()}
          isSubmitting={false}
        />,
      );
      expect(
        screen.getByRole("button", { name: /AI 진단 요청 접수하기/ }).hasAttribute("disabled"),
      ).toBe(true);

      // 2개 모두 선택된 상태: 버튼 활성화
      rerender(
        <SubmissionConfirm
          problemPhoto={dummyProblem}
          workPhotos={[dummyWork]}
          metadata={dummyMeta}
          privacyChecked={true}
          legibilityChecked={true}
          onPrivacyCheckedChange={handlePrivacyChange}
          onLegibilityCheckedChange={handleLegibilityChange}
          onSubmit={handleSubmit}
          onBackToEdit={vi.fn()}
          isSubmitting={false}
        />,
      );
      const activeBtn = screen.getByRole("button", {
        name: /AI 진단 요청 접수하기/,
      });
      expect(activeBtn.hasAttribute("disabled")).toBe(false);

      // 클릭 시 submit 핸들러 호출
      fireEvent.click(activeBtn);
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe("SubmissionWizard", () => {
    it("초기 상태에서는 사진이 없어 '다음: 문제 정보 입력' 버튼이 비활성화된다", () => {
      render(
        <TestWrapper>
          <SubmissionWizard />
        </TestWrapper>,
      );

      const nextBtn = screen.getByRole("button", {
        name: /다음: 문제 정보 입력/,
      });
      expect(nextBtn.hasAttribute("disabled")).toBe(true);
    });
  });
});
