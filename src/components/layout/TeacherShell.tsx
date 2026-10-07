import React, { useState } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { DemoControls } from "../app/DemoControls";
import { LayoutDashboard, Users, CheckSquare, FileText, Menu, X, LogOut } from "lucide-react";
import { useDemoSession } from "../../features/auth/DemoSessionProvider";

export function TeacherShell() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { session, logout } = useDemoSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "대시보드", path: "/teacher", icon: LayoutDashboard },
    { label: "학생 관리", path: "/teacher/students", icon: Users },
    { label: "검수 대기", path: "/teacher/reviews", icon: CheckSquare },
    { label: "리포트 발행", path: "/teacher/reports", icon: FileText },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DemoControls />

      {/* 헤더 (64px) */}
      <header className="sticky top-[49px] z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="메뉴 열기/닫기"
            className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg text-secondary lg:hidden hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <Link to="/teacher" className="flex items-center gap-2 font-bold text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white text-base">
              교
            </span>
            <span className="text-lg tracking-tight">선생님 포털</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-secondary hidden sm:inline">
            {session?.name} 선생님
          </span>
          <button
            type="button"
            onClick={logout}
            className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-control px-3 text-xs font-semibold text-secondary hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* 데스크톱 사이드바 (1280px+ 224px, 1024~1279px 72px) */}
        <aside
          aria-label="교사 사이드바 메뉴"
          className="hidden border-r border-border bg-card lg:flex lg:w-[72px] xl:w-[224px] flex-col justify-between p-3"
        >
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentPath === item.path ||
                (item.path !== "/teacher" && currentPath.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                    isActive
                      ? "bg-primary text-white shadow-xs"
                      : "text-secondary hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* 모바일 드로어 */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-overlay backdrop-blur-xs lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <aside
              className="h-full w-64 bg-card p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <nav className="mt-8 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${
                        isActive ? "bg-primary text-white" : "text-secondary hover:bg-accent"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* 메인 본문 */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
