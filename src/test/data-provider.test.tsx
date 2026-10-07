import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import React from "react";
import { DataProvider, useDataMode } from "../services/data-provider";

function TestConsumer() {
  const { mode, isMock, isSupportedMode } = useDataMode();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="isMock">{isMock ? "true" : "false"}</span>
      <span data-testid="isSupportedMode">{isSupportedMode ? "true" : "false"}</span>
    </div>
  );
}

describe("DataProvider", () => {
  it("기본 mock 모드로 올바르게 초기화된다", () => {
    render(
      <DataProvider initialMode="mock">
        <TestConsumer />
      </DataProvider>,
    );

    expect(screen.getByTestId("mode").textContent).toBe("mock");
    expect(screen.getByTestId("isMock").textContent).toBe("true");
    expect(screen.getByTestId("isSupportedMode").textContent).toBe("true");
  });

  it("미지원 모드(예: supabase)일 경우 경고 화면을 표시하고 외부 연결을 차단한다", () => {
    render(
      <DataProvider initialMode="supabase">
        <TestConsumer />
      </DataProvider>,
    );

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("지원하지 않는 데이터 모드")).toBeDefined();
    expect(screen.getByText(/외부 백엔드로 자동 fallback하지 않습니다/)).toBeDefined();
  });

  it("Provider 밖에서 useDataMode 호출 시 에러를 던진다", () => {
    expect(() => render(<TestConsumer />)).toThrow(
      "useDataMode must be used within a DataProvider",
    );
  });
});
