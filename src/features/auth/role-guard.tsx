import React from "react";
import { Navigate } from "@tanstack/react-router";
import type { Role } from "../../contracts/domain";
import { useDemoSession } from "./DemoSessionProvider";
import { AppErrorState } from "../../components/app/AppErrorState";

export interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { session, isLoading, role, mustChangePassword } = useDemoSession();

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[50vh] items-center justify-center p-8"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-secondary">권한 및 세션을 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  // 로그인되지 않은 경우
  if (!session || !role) {
    return <Navigate to="/login" />;
  }

  // 최초 로그인 시 비밀번호 변경 필요 상태
  if (mustChangePassword) {
    return <Navigate to="/onboarding" />;
  }

  // 특정 역할 제한이 있는 경우
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <AppErrorState
        status={403}
        title="접근이 제한된 페이지입니다"
        description={`이 페이지는 ${allowedRoles.join(", ")} 권한 전용입니다. 현재 계정 권한은 '${role}'입니다.`}
      />
    );
  }

  return <>{children}</>;
}
