/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { IAppRepository } from "../contracts/repository";
import { DemoRepository } from "./demo-repository";

export type DataMode = "mock" | "supabase" | string;

export interface DataContextValue {
  mode: DataMode;
  isMock: boolean;
  isInitialized: boolean;
  isSupportedMode: boolean;
  repository: IAppRepository;
}

const DataContext = createContext<DataContextValue | null>(null);

export interface DataProviderProps {
  children: React.ReactNode;
  initialMode?: DataMode;
  repository?: IAppRepository;
}

export function DataProvider({ children, initialMode, repository }: DataProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  const envMode =
    typeof import.meta !== "undefined"
      ? (import.meta.env as Record<string, string | undefined> | undefined)?.["VITE_DATA_MODE"]
      : undefined;
  const activeMode: DataMode = initialMode ?? envMode ?? "mock";

  const isMock = activeMode === "mock";
  // 현재 단계에서는 mock 모드만 완전 지원하며, supabase 등 다른 모드는 준비 중으로 간주
  const isSupportedMode = isMock;

  const defaultRepository = useMemo(() => new DemoRepository(), []);
  const activeRepository = repository ?? defaultRepository;

  useEffect(() => {
    // 브라우저 마운트 후 초기화 완료
    setIsInitialized(true);
  }, []);

  const value: DataContextValue = {
    mode: activeMode,
    isMock,
    isInitialized,
    isSupportedMode,
    repository: activeRepository,
  };

  // 지원하지 않는 모드일 경우 원격 요청을 차단하고 안내 화면 렌더링
  if (isInitialized && !isSupportedMode) {
    return (
      <div
        role="alert"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#F8FAFC",
          color: "#0F172A",
          textAlign: "center",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            backgroundColor: "#FFFFFF",
            padding: "32px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            border: "1px solid #E2E8F0",
          }}
        >
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "700",
              marginBottom: "12px",
              color: "#B91C1C",
            }}
          >
            지원하지 않는 데이터 모드
          </h1>
          <p
            style={{
              fontSize: "14px",
              lineHeight: "1.6",
              color: "#475569",
              marginBottom: "20px",
            }}
          >
            현재 서비스는 안전한 프론트엔드 도안 검증을 위해 <strong>mock 모드</strong>로만
            실행됩니다.
            <br />
            설정된 모드(<code>{activeMode}</code>)는 현재 연결이 지원되지 않으며, 외부 백엔드로 자동
            fallback하지 않습니다.
          </p>
          <div
            style={{
              padding: "12px",
              backgroundColor: "#FEF2F2",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#991B1B",
            }}
          >
            환경변수 <code>VITE_DATA_MODE=mock</code>으로 실행하거나 기본값을 유지해 주세요.
          </div>
        </div>
      </div>
    );
  }

  // SSR 및 초기화 중에는 공통 미초기화 shell 제공 (hydration 불일치 방지)
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataMode(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useDataMode must be used within a DataProvider");
  }
  return context;
}

export function useAppRepository(): IAppRepository {
  const { repository } = useDataMode();
  return repository;
}
