import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { HintPanel } from "../features/student/HintPanel";
import { WorkLineList } from "../features/student/WorkLineList";
import { ErrorRegionOverlay } from "../components/app/ErrorRegionOverlay";
import { HelpRequestDialog } from "../features/student/HelpRequestDialog";
import type { RevealedHintItem, RecognizedLine, ErrorRegion } from "../contracts/domain";

describe("Phase 4 - 학생 케이스 진단 결과 컴포넌트 테스트", () => {
  describe("HintPanel", () => {
    it("0단계 상태에서는 1단계 힌트 열기 버튼이 표시된다", () => {
      const handleReveal = vi.fn();
      render(
        <HintPanel
          revealedHints={[]}
          canRevealNextHint={true}
          helpRequested={false}
          onRevealHint={handleReveal}
        />,
      );

      expect(screen.getByText("0 / 3단계 열람")).toBeDefined();
      const btn = screen.getByRole("button", { name: /1단계 힌트 열기/ });
      expect(btn).toBeDefined();

      fireEvent.click(btn);
      expect(handleReveal).toHaveBeenCalledWith(1);
    });

    it("1단계 힌트가 이미 열려있을 때 2단계 힌트 열기 버튼이 표시된다", () => {
      const hints: RevealedHintItem[] = [
        {
          level: 1,
          text: "이항할 때 부호에 주의하세요.",
          revealedAt: "2026-10-07T00:00:00Z",
          resultVersion: 1,
        },
      ];
      const handleReveal = vi.fn();

      render(
        <HintPanel
          revealedHints={hints}
          canRevealNextHint={true}
          helpRequested={false}
          onRevealHint={handleReveal}
        />,
      );

      expect(screen.getByText("1 / 3단계 열람")).toBeDefined();
      expect(screen.getByText("이항할 때 부호에 주의하세요.")).toBeDefined();

      const btn = screen.getByRole("button", { name: /2단계 힌트 열기/ });
      expect(btn).toBeDefined();
    });

    it("선생님께 질문을 요청한 상태에서는 힌트 열기가 차단되고 안내가 표시된다", () => {
      render(
        <HintPanel
          revealedHints={[]}
          canRevealNextHint={false}
          helpRequested={true}
          onRevealHint={vi.fn()}
        />,
      );

      expect(screen.getByText(/선생님께 질문이 접수되어 확인 대기 중입니다/)).toBeDefined();
      expect(screen.queryByRole("button", { name: /힌트 열기/ })).toBeNull();
    });
  });

  describe("WorkLineList & ErrorRegionOverlay", () => {
    const dummyLines: RecognizedLine[] = [
      { lineId: "L01", text: "2x + 4 = 12" },
      { lineId: "L02", text: "2x = 12 + 4" },
    ];
    const dummyError: ErrorRegion = {
      lineId: "L02",
      bbox: { x: 0.1, y: 0.2, w: 0.8, h: 0.2 },
    };

    it("오류가 발생한 줄에 오류 단계 태그가 표시된다", () => {
      render(<WorkLineList lines={dummyLines} errorRegion={dummyError} />);

      expect(screen.getByText("L01")).toBeDefined();
      expect(screen.getByText("L02")).toBeDefined();
      expect(screen.getByText("⚠️ 오류 단계")).toBeDefined();
    });

    it("ErrorRegionOverlay는 bbox가 존재할 때만 올바른 영역을 렌더링한다", () => {
      const { rerender } = render(<ErrorRegionOverlay errorRegion={dummyError} />);

      const overlay = screen.getByLabelText("오류 발생 영역: L02");
      expect(overlay).toBeDefined();
      expect(overlay.style.left).toBe("10%");
      expect(overlay.style.top).toBe("20%");

      // bbox가 null일 때 아무것도 렌더링하지 않음
      rerender(<ErrorRegionOverlay errorRegion={{ lineId: "L02", bbox: null }} />);
      expect(screen.queryByLabelText("오류 발생 영역: L02")).toBeNull();
    });
  });

  describe("HelpRequestDialog", () => {
    it("질문 내용을 작성하고 제출할 수 있다", async () => {
      const handleSubmit = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();

      render(<HelpRequestDialog isOpen={true} onClose={handleClose} onSubmit={handleSubmit} />);

      const textarea = screen.getByPlaceholderText(/부호가 왜 바뀌어야 하는지/);
      fireEvent.change(textarea, { target: { value: "이 부분이 이해가 잘 안 돼요." } });

      const submitBtn = screen.getByRole("button", { name: "질문 접수하기" });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith("이 부분이 이해가 잘 안 돼요.");
        expect(handleClose).toHaveBeenCalled();
      });
    });
  });
});
