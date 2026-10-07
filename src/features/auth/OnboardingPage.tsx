import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordInput } from "../../contracts/inputs";
import { useDemoSession } from "./DemoSessionProvider";
import { useNavigate } from "@tanstack/react-router";
import { PasswordField } from "../../components/app/PasswordField";
import { ErrorSummary } from "../../components/app/ErrorSummary";
import { KeyRound, ShieldCheck, Camera, Check } from "lucide-react";

export function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const { session, changePassword } = useDemoSession();
  const navigate = useNavigate();
  const [errorsSummary, setErrorsSummary] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1단계 비밀번호 폼
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    setIsSubmitting(true);
    setErrorsSummary([]);
    try {
      const res = await changePassword(data);
      if (res.success) {
        setCurrentStep(2);
      } else {
        setErrorsSummary([res.message || "비밀번호 변경에 실패했습니다."]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCompleteOnboarding = () => {
    navigate({ to: "/student" });
  };

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[480px] rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm text-left">
        {/* 단계 진행바 */}
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {currentStep}
            </span>
            <span className="text-sm font-bold text-foreground">
              {currentStep === 1 && "임시 비밀번호 변경"}
              {currentStep === 2 && "동의 상태 확인"}
              {currentStep === 3 && "서비스 이용 안내"}
            </span>
          </div>
          <span className="text-xs font-semibold text-secondary">단계 {currentStep} / 3</span>
        </div>

        {/* 1단계: 비밀번호 변경 */}
        {currentStep === 1 && (
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">
                안전한 새 비밀번호를 설정해 주세요
              </h2>
              <p className="mt-1 text-sm text-secondary">
                초기 발급된 임시 비밀번호를 변경해야 서비스 이용이 가능합니다. (12~64자)
              </p>
            </div>

            <ErrorSummary errors={errorsSummary} />

            <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
              <PasswordField
                label="현재 임시 비밀번호"
                required
                error={errors.currentPassword?.message}
                {...register("currentPassword")}
              />
              <PasswordField
                label="새 비밀번호"
                hint="영문, 숫자, 특수문자를 포함하여 12자리 이상"
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
                className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? "변경 중..." : "비밀번호 변경 및 다음"}
              </button>
            </form>
          </div>
        )}

        {/* 2단계: 동의 상태 확인 */}
        {currentStep === 2 && (
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">필수 약관 및 동의 상태</h2>
              <p className="mt-1 text-sm text-secondary">
                학습 진단을 위한 필수 동의 사항을 확인합니다.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">서비스 이용약관</span>
                <span className="flex items-center gap-1 text-xs font-bold text-success">
                  <Check className="h-4 w-4" /> 동의 완료
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">개인정보 수집 및 이용 동의</span>
                <span className="flex items-center gap-1 text-xs font-bold text-success">
                  <Check className="h-4 w-4" /> 동의 완료
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <div>
                  <span className="font-medium text-foreground">법정대리인(보호자) 동의</span>
                  <p className="text-xs text-secondary mt-0.5">
                    14세 미만 학생의 경우 학부모의 정식 동의가 필요합니다.
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-success">
                  <Check className="h-4 w-4" /> 확인됨
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              확인 및 다음 단계
            </button>
          </div>
        )}

        {/* 3단계: 서비스 사용 안내 */}
        {currentStep === 3 && (
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">사진 촬영 시 주의사항</h2>
              <p className="mt-1 text-sm text-secondary">
                정확한 AI 진단을 위해 다음 3가지 규칙을 지켜주세요.
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex gap-3 rounded-xl border border-border p-3.5 bg-card">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-foreground">문제 1개씩 촬영하기</h3>
                  <p className="text-xs text-secondary mt-0.5">
                    한 번에 1개의 문제와 그 풀이만 촬영해 주세요. 여러 문제가 섞이면 진단이
                    보류됩니다.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 rounded-xl border border-border p-3.5 bg-card">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-foreground">풀이 과정을 줄 단위로 작성하기</h3>
                  <p className="text-xs text-secondary mt-0.5">
                    답만 적지 않고 위에서 아래로 풀이 식을 줄 단위로 써야 어느 줄에서 틀렸는지 찾을
                    수 있어요.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 rounded-xl border border-border p-3.5 bg-card">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-error-bg text-error font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-foreground">이름·연락처 등 개인정보 가리기</h3>
                  <p className="text-xs text-secondary mt-0.5">
                    교재 상단이나 풀이 주변에 적힌 이름이나 전화번호는 사진 편집 도구로 가려주세요.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onCompleteOnboarding}
              className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              준비 완료, 학습 시작하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
