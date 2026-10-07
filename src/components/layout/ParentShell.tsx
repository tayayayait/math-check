import React from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { DemoControls } from "../app/DemoControls";
import { useDemoSession } from "../../features/auth/DemoSessionProvider";
import { Home, User, LogOut } from "lucide-react";

export function ParentShell() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { session, logout } = useDemoSession();

  const navItems = [
    { label: "학습 현황", path: "/parent", icon: Home },
    { label: "내 정보", path: "/account", icon: User },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DemoControls />

      {/* 헤더 (56px) */}
      <header className="sticky top-[49px] z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
        <Link to="/parent" className="flex items-center gap-2 font-bold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-bold text-white text-sm">
            학
          </span>
          <span className="text-base tracking-tight">학부모 리포트</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-secondary hidden sm:inline">
            {session?.name} 님
          </span>
          <button
            type="button"
            onClick={logout}
            className="flex min-h-[40px] items-center gap-1 rounded-lg border border-control px-2.5 text-xs font-semibold text-secondary hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        </div>
      </header>

      {/* 본문 (최대 720px 리포트 최적화) */}
      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-4 py-6">
        <Outlet />
      </main>

      {/* 하단 네비게이션 */}
      <nav
        aria-label="학부모 하단 메뉴"
        className="sticky bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-card/95 pb-safe backdrop-blur-md sm:hidden"
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
    </div>
  );
}
