import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordInput } from "../../contracts/inputs";
import { useDemoSession } from "./DemoSessionProvider";
import { PasswordField } from "../../components/app/PasswordField";
import { ErrorSummary } from "../../components/app/ErrorSummary";
import { ROLE_LABELS } from "../../domain/status-labels";
import { User, LogOut, CheckCircle2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function AccountPage() {
  const { session, logout, changePassword } = useDemoSession();
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await changePassword(data);
      if (res.success) {
        setSuccessMessage("비밀번호가 안전하게 변경되었습니다. 다시 로그인해 주세요.");
        reset();
        setTimeout(async () => {
          await logout();
          navigate({ to: "/login" });
        }, 1500);
      } else {
        setErrorMessage(res.message || "비밀번호 변경에 실패했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  if (!session) return null;

  return (
    <div className="w-full space-y-6 text-left">
      {/* 프로필 카드 */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <User className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{session.name}</h1>
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-secondary">
                {ROLE_LABELS[session.role]}
              </span>
            </div>
            <p className="mt-1 text-sm text-secondary">
              {session.role === "STUDENT"
                ? `아이디: ${session.loginId}`
                : `이메일: ${session.email}`}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
          <div>
            <span className="text-secondary">계정 상태</span>
            <p className="font-semibold text-foreground mt-0.5">{session.accountStatus}</p>
          </div>
          {session.gradeLevel && (
            <div>
              <span className="text-secondary">학년</span>
              <p className="font-semibold text-foreground mt-0.5">
                중학교 {session.gradeLevel}학년
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 비밀번호 변경 섹션 */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-1">비밀번호 변경</h2>
        <p className="text-xs text-secondary mb-5">
          주기적으로 비밀번호를 변경하여 학습 계정을 안전하게 보호하세요.
        </p>

        {successMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-success-bg p-3 text-xs font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" />
            {successMessage}
          </div>
        )}

        <ErrorSummary errors={errorMessage ? [errorMessage] : []} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <PasswordField
            label="현재 비밀번호"
            required
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
          />
          <PasswordField
            label="새 비밀번호"
            hint="영문, 숫자 포함 12자리 이상"
            required
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
          <PasswordField
            label="새 비밀번호 확인"
            required
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex min-h-[48px] w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      </div>

      {/* 로그아웃 버튼 */}
      <button
        type="button"
        onClick={handleLogout}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-error/30 bg-card p-3 text-sm font-semibold text-error hover:bg-error-bg/30 focus:outline-none focus:ring-2 focus:ring-error"
      >
        <LogOut className="h-4 w-4" />
        로그아웃
      </button>
    </div>
  );
}
