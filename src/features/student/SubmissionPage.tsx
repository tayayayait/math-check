import React, { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAppRepository } from "../../services/data-provider";
import { SubmissionWizard } from "./SubmissionWizard";
import { Button } from "../../components/ui/button";
import { isSuccessResponse } from "../../contracts/errors";
import type { StudentCaseListItemDto } from "../../contracts/dto";

export function SubmissionPage() {
  const repo = useAppRepository();
  const [activeProcessingCase, setActiveProcessingCase] = useState<StudentCaseListItemDto | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function checkActiveAnalysis() {
      setIsLoading(true);
      const res = await repo.listCases({ status: "PROCESSING", pageSize: 5 });
      if (isMounted) {
        if (isSuccessResponse(res) && res.data.items.length > 0) {
          setActiveProcessingCase(res.data.items[0] || null);
        } else {
          setActiveProcessingCase(null);
        }
        setIsLoading(false);
      }
    }
    checkActiveAnalysis();
    return () => {
      isMounted = false;
    };
  }, [repo]);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        제출 가능 상태를 확인하고 있습니다...
      </div>
    );
  }

  // 활성 분석 1개 제한: 이미 진행 중인 분석이 있을 경우 제출 차단 화면
  if (activeProcessingCase) {
    return (
      <div className="max-w-[480px] mx-auto py-8 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-3xl">
          ⏳
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">현재 다른 문제를 분석하고 있어요</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            원활한 진단을 위해 동시에 1개의 문제만 분석할 수 있습니다.
            <br />
            현재 진행 중인 분석이 완료된 후 새로운 문제를 제출해 주세요.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5">
          <span className="font-semibold text-slate-800 text-sm block">
            진행 중인 문제: {activeProcessingCase.bookTitle}
          </span>
          <p className="text-slate-600">
            {activeProcessingCase.page}쪽 #{activeProcessingCase.problemNo} · 접수 상태: 분석 중
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Link to="/student/cases/$caseId" params={{ caseId: activeProcessingCase.caseId }}>
            <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
              진행 중인 분석 현황 보기 →
            </Button>
          </Link>
          <Link to="/student">
            <Button variant="ghost" className="w-full h-10 text-xs text-slate-500">
              학생 홈으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="pb-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">새 문제 풀이 제출</h1>
        <p className="text-sm text-slate-500 mt-1">
          교재 문제와 본인이 직접 푼 손글씨 풀이를 촬영하여 등록해 주세요.
        </p>
      </div>

      <SubmissionWizard />
    </div>
  );
}
