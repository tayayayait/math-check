import React from "react";
import { useDemoSession } from "../../features/auth/DemoSessionProvider";
import { useAppRepository } from "../../services/data-provider";
import { ROLE_LABELS } from "../../domain/status-labels";
import { RotateCcw, UserCheck } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function DemoControls() {
  const { session, switchActor, refreshSession } = useDemoSession();
  const repo = useAppRepository();
  const navigate = useNavigate();

  const demoActors = [
    { id: "usr_student_01", label: "학생 A (김민수)", path: "/student" },
    { id: "usr_student_02", label: "학생 B (확인대기)", path: "/student" },
    { id: "usr_student_03", label: "학생 C (시도한도)", path: "/student" },
    { id: "usr_student_04", label: "학생 D (온보딩)", path: "/onboarding" },
    { id: "usr_teacher_01", label: "교사 (강선생)", path: "/teacher" },
    { id: "usr_parent_01", label: "학부모 (김학부모)", path: "/parent" },
    { id: "usr_admin_01", label: "대표 (최대표)", path: "/admin/settings" },
  ];

  const handleSwitch = async (actorId: string, targetPath: string) => {
    const success = await switchActor(actorId);
    if (success) {
      navigate({ to: targetPath });
    }
  };

  const handleReset = async () => {
    if (window.confirm("모든 모의 데이터를 초기 상태로 되돌리시겠습니까?")) {
      await repo.resetDemoData();
      await refreshSession();
      navigate({ to: "/" });
    }
  };

  return (
    <aside
      aria-label="데모 검수 컨트롤 바"
      className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur-sm shadow-xs"
    >
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
          <UserCheck className="h-3.5 w-3.5" />
          {session ? `${session.name} (${ROLE_LABELS[session.role]})` : "미로그인"}
        </span>
        <span className="text-xs text-secondary hidden sm:inline">| 데모 역할 빠른 전환:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {demoActors.map((actor) => {
          const isActive = session?.actorId === actor.id;
          return (
            <button
              key={actor.id}
              type="button"
              onClick={() => handleSwitch(actor.id, actor.path)}
              className={`min-h-[36px] rounded-md px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                isActive
                  ? "bg-primary text-white shadow-xs"
                  : "bg-muted text-foreground hover:bg-accent"
              }`}
            >
              {actor.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleReset}
          title="모의 데이터 초기화"
          aria-label="모의 데이터 초기화"
          className="flex min-h-[36px] items-center gap-1 rounded-md border border-control px-2.5 py-1 text-xs font-semibold text-secondary hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">초기화</span>
        </button>
      </div>
    </aside>
  );
}
