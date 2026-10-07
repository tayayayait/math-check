import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "../../contracts/inputs";
import { useDemoSession } from "./DemoSessionProvider";
import { useNavigate } from "@tanstack/react-router";
import { FormField } from "../../components/app/FormField";
import { PasswordField } from "../../components/app/PasswordField";
import { ErrorSummary } from "../../components/app/ErrorSummary";
import { GraduationCap, Mail, Sparkles } from "lucide-react";

export function LoginPage() {
  const [activeTab, setActiveTab] = useState<"STUDENT" | "EMAIL">("STUDENT");
  const { login, switchActor } = useDemoSession();
  const navigate = useNavigate();
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      kind: "STUDENT",
      loginId: "sminsu01",
      email: "",
      password: "password1234!",
      remember: true,
    },
  });

  const handleTabChange = (kind: "STUDENT" | "EMAIL") => {
    setActiveTab(kind);
    setValue("kind", kind);
    setFormErrors([]);
    if (kind === "STUDENT") {
      setValue("loginId", "sminsu01");
      setValue("email", "");
    } else {
      setValue("loginId", "");
      setValue("email", "kang.teacher@example.com");
    }
  };

  const onSubmit = async (data: LoginInput) => {
    setIsSubmitting(true);
    setFormErrors([]);
    try {
      const res = await login(data);
      if (res.success) {
        if (data.kind === "STUDENT") {
          navigate({ to: "/student" });
        } else if (data.email?.includes("teacher")) {
          navigate({ to: "/teacher" });
        } else if (data.email?.includes("parent")) {
          navigate({ to: "/parent" });
        } else {
          navigate({ to: "/admin/settings" });
        }
      } else {
        setFormErrors([res.message || "로그인에 실패했습니다."]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickLogin = async (actorId: string, rolePath: string) => {
    const success = await switchActor(actorId);
    if (success) {
      navigate({ to: rolePath });
    }
  };

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm text-center">
        {/* 서비스 타이틀 */}
        <div className="mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-bold text-xl shadow-md">
            수
          </div>
          <h1 className="mt-3 text-2xl font-bold text-foreground">수학 손글씨 진단</h1>
          <p className="mt-1 text-sm text-secondary">
            AI 손글씨 풀이 분석 및 맞춤형 오답 진단 서비스
          </p>
        </div>

        {/* 학생 / 선생님·학부모 탭 전환 */}
        <div className="mb-6 flex rounded-xl bg-muted p-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "STUDENT"}
            onClick={() => handleTabChange("STUDENT")}
            className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring ${
              activeTab === "STUDENT"
                ? "bg-card text-foreground shadow-xs"
                : "text-secondary hover:text-foreground"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            학생 로그인
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "EMAIL"}
            onClick={() => handleTabChange("EMAIL")}
            className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring ${
              activeTab === "EMAIL"
                ? "bg-card text-foreground shadow-xs"
                : "text-secondary hover:text-foreground"
            }`}
          >
            <Mail className="h-4 w-4" />
            교사 / 학부모
          </button>
        </div>

        <ErrorSummary errors={formErrors} />

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {activeTab === "STUDENT" ? (
            <FormField
              label="학생 아이디"
              hint="학원에서 발급된 s로 시작하는 9자리 아이디 (예: sminsu01)"
              required
              error={errors.loginId?.message}
              {...register("loginId")}
            />
          ) : (
            <FormField
              label="이메일 주소"
              type="email"
              placeholder="example@academy.com"
              required
              error={errors.email?.message}
              {...register("email")}
            />
          )}

          <PasswordField
            label="비밀번호"
            required
            error={errors.password?.message}
            {...register("password")}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* 검수용 데모 빠른 접속 */}
        <div className="mt-8 border-t border-border pt-6">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-secondary mb-3">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            검수용 원클릭 데모 로그인
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => quickLogin("usr_student_01", "/student")}
              className="min-h-[40px] rounded-lg border border-control bg-card p-2 text-foreground hover:bg-accent font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            >
              학생 A (김민수)
            </button>
            <button
              type="button"
              onClick={() => quickLogin("usr_teacher_01", "/teacher")}
              className="min-h-[40px] rounded-lg border border-control bg-card p-2 text-foreground hover:bg-accent font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            >
              교사 (강선생)
            </button>
            <button
              type="button"
              onClick={() => quickLogin("usr_parent_01", "/parent")}
              className="min-h-[40px] rounded-lg border border-control bg-card p-2 text-foreground hover:bg-accent font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            >
              학부모 (김학부모)
            </button>
            <button
              type="button"
              onClick={() => quickLogin("usr_admin_01", "/admin/settings")}
              className="min-h-[40px] rounded-lg border border-control bg-card p-2 text-foreground hover:bg-accent font-medium focus:outline-none focus:ring-2 focus:ring-ring"
            >
              대표 (최대표)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
