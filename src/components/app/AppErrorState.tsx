import React from "react";
import { Link } from "@tanstack/react-router";

export interface AppErrorStateProps {
  status: 403 | 404 | 500 | 503;
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
}

export function AppErrorState({
  status,
  title,
  description,
  actionText = "홈으로 돌아가기",
  actionHref = "/",
}: AppErrorStateProps) {
  const defaultTitles: Record<number, string> = {
    403: "접근 권한이 없습니다",
    404: "요청하신 정보를 찾을 수 없습니다",
    500: "시스템 오류가 발생했습니다",
    503: "서비스 점검 중입니다",
  };

  const defaultDescriptions: Record<number, string> = {
    403: "현재 로그인된 계정의 권한으로는 접근할 수 없는 화면입니다. 올바른 계정으로 전환해 주세요.",
    404: "페이지가 삭제되었거나 잘못된 경로로 접근하셨습니다.",
    500: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    503: "안정적인 서비스 제공을 위해 점검 중입니다.",
  };

  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <span className="inline-block rounded-full bg-error-bg px-3.5 py-1 text-sm font-bold text-error">
          {status} ERROR
        </span>
        <h1 className="mt-4 text-xl font-bold text-foreground">{title || defaultTitles[status]}</h1>
        <p className="mt-2 text-sm leading-relaxed text-secondary">
          {description || defaultDescriptions[status]}
        </p>
        <div className="mt-6 flex justify-center">
          <a
            href={actionHref}
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {actionText}
          </a>
        </div>
      </div>
    </div>
  );
}
