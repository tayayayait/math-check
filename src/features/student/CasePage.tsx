import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useAppRepository } from "../../services/data-provider";
import { CaseResult } from "./CaseResult";
import { AppErrorState } from "../../components/app/AppErrorState";
import { isSuccessResponse } from "../../contracts/errors";
import type { StudentCaseDto } from "../../contracts/dto";

export function CasePage() {
  const { caseId } = useParams({ strict: false }) as { caseId: string };
  const repo = useAppRepository();

  const [caseDetail, setCaseDetail] = useState<StudentCaseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 분석 중 시뮬레이션 단계
  const [processingStage, setProcessingStage] = useState<
    "QUEUED" | "SANITIZING" | "ANALYZING" | "VERIFYING"
  >("ANALYZING");

  const loadCase = useCallback(async () => {
    if (!caseId) return;
    setIsLoading(true);
    const res = await repo.getStudentCase(caseId);

    if (isSuccessResponse(res)) {
      setCaseDetail(res.data);
      setErrorMessage(null);
    } else {
      setErrorMessage(res.error.message || "해당 진단 건을 찾을 수 없습니다.");
    }
    setIsLoading(false);
  }, [repo, caseId]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  // 분석 중(PROCESSING) 상태일 때 시뮬레이션 전이
  useEffect(() => {
    if (!caseDetail || caseDetail.caseStatus !== "PROCESSING") return;

    const stages: Array<"QUEUED" | "SANITIZING" | "ANALYZING" | "VERIFYING"> = [
      "QUEUED",
      "SANITIZING",
      "ANALYZING",
      "VERIFYING",
    ];
    let idx = 0;

    const interval = setInterval(() => {
      idx++;
      if (idx < stages.length) {
        setProcessingStage(stages[idx]!);
      } else {
        clearInterval(interval);
        // 분석 완료 상태로 전환
        setCaseDetail((prev: StudentCaseDto | null) => {
          if (!prev) return null;
          return {
            ...prev,
            caseStatus: "RETRY_REQUIRED",
            verdict: "INCORRECT",
            studentMessage: "부호 계산에 유의하여 다시 확인해 보세요.",
            canRevealNextHint: true,
            canResubmit: true,
          };
        });
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [caseDetail?.caseStatus]);

  // 힌트 열람 핸들러
  const handleRevealHint = async (level: number) => {
    if (!caseDetail) return;
    const idempotencyKey = `hint_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const res = await repo.revealHint({
      attemptId: caseDetail.currentAttemptId,
      resultVersion: caseDetail.resultVersion,
      level,
      idempotencyKey,
    });

    if (isSuccessResponse(res)) {
      setCaseDetail((prev: StudentCaseDto | null) => {
        if (!prev) return null;
        const updatedHints = [
          ...prev.revealedHints,
          {
            level: res.data.revealedLevel,
            text: res.data.hint,
            revealedAt: new Date().toISOString(),
            resultVersion: res.data.resultVersion,
          },
        ];
        return {
          ...prev,
          revealedHints: updatedHints,
          canRevealNextHint: updatedHints.length < 3,
        };
      });
    } else {
      throw new Error(res.error.message);
    }
  };

  // 질문 요청 핸들러
  const handleRequestHelp = async (message: string) => {
    if (!caseDetail) return;
    const idempotencyKey = `help_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const res = await repo.requestHelp({
      caseId: caseDetail.caseId,
      message,
      idempotencyKey,
    });

    if (isSuccessResponse(res)) {
      setCaseDetail((prev: StudentCaseDto | null) => {
        if (!prev) return null;
        return {
          ...prev,
          helpRequested: true,
          caseStatus: "WAITING_TEACHER",
          canRevealNextHint: false,
          canAskTeacher: false,
        };
      });
    } else {
      throw new Error(res.error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        진단 결과를 불러오고 있습니다...
      </div>
    );
  }

  if (errorMessage || !caseDetail) {
    return (
      <AppErrorState
        status={404}
        title="진단 내역을 찾을 수 없습니다"
        description={errorMessage || "존재하지 않거나 접근 권한이 없는 문제입니다."}
        actionText="학생 홈으로 돌아가기"
        actionHref="/student"
      />
    );
  }

  // 아직 분석 중인 경우 화면
  if (caseDetail.caseStatus === "PROCESSING") {
    const stageLabels: Record<string, string> = {
      QUEUED: "분석 대기열에 등록되었습니다",
      SANITIZING: "개인정보 보호 처리 및 정제 중...",
      ANALYZING: "AI 손글씨 수식 인식 및 단계별 풀이 검증 중...",
      VERIFYING: "진단 결과 무결성 확인 중...",
    };

    return (
      <div className="max-w-[480px] mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-3xl animate-pulse">
          ⏳
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">풀이를 진단하고 있습니다</h2>
          <p className="text-xs text-blue-600 font-semibold bg-blue-50 py-1.5 px-3 rounded-full inline-block">
            {stageLabels[processingStage]}
          </p>
          <p className="text-xs text-slate-500 pt-2 leading-relaxed">
            {caseDetail.bookTitle} ({caseDetail.page}쪽 #{caseDetail.problemNo})<br />
            잠시만 기다려 주시면 진단 결과와 힌트가 곧 제공됩니다.
          </p>
        </div>

        <div className="pt-4">
          <Link to="/student">
            <button type="button" className="text-xs text-slate-500 hover:text-slate-800 underline">
              홈으로 이동 (분석은 백그라운드에서 계속 진행됩니다)
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CaseResult
      caseDetail={caseDetail}
      onRevealHint={handleRevealHint}
      onRequestHelp={handleRequestHelp}
    />
  );
}
