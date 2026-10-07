import React from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { DemoControls } from "../app/DemoControls";
import { Home, History, User } from "lucide-react";

export function StudentShell() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // 촬영/재풀이/제출 화면에서는 하단 네비게이션 숨김 (CTA 바에 집중)
  const isSubmissionFlow =
    currentPath.includes("/submissions/new") || currentPath.includes("/retry");

  const navItems = [
    { label: "홈", path: "/student", icon: Home },
    { label: "기록", path: "/student/history", icon: History },
    { label: "내 정보", path: "/account", icon: User },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DemoControls />

      {/* 헤더 (56px) */}
      <header className="sticky top-[49px] z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <Link
          to="/student"
          className="flex items-center gap-2 font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-bold text-white text-sm">
            수
          </span>
          <span className="text-base tracking-tight">수학 진단 AI</span>
        </Link>
      </header>

      {/* 본문 (최대 480px 모바일 중심) */}
      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 py-6 pb-24">
        <Outlet />
      </main>

      {/* 하단 네비게이션 (56px) */}
      {!isSubmissionFlow && (
        <nav
          aria-label="학생 하단 메뉴"
          className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-border bg-card/95 pb-safe backdrop-blur-md"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center min-h-[48px] min-w-[64px] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                  isActive ? "text-primary font-bold" : "text-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-1 text-[11px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
