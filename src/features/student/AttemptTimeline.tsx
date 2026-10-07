import React from "react";
import { formatSeoulDateTime } from "../../domain/seoul-date";
import type { StudentCaseDto } from "../../contracts/dto";

interface AttemptTimelineProps {
  caseDetail: StudentCaseDto;
}

export function AttemptTimeline({ caseDetail }: AttemptTimelineProps) {
  const maxAttempts = caseDetail.maxEvaluatedCount + caseDetail.extraAttemptAllowance;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">풀이 시도 현황</h3>
        <span className="text-xs font-semibold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full">
          {caseDetail.evaluatedCount} / {maxAttempts}회 시도
        </span>
      </div>

      <div className="space-y-2 text-xs text-slate-600">
        <div className="flex items-center justify-between py-1">
          <span className="text-slate-500">최초 제출 일시</span>
          <span className="font-medium text-slate-800">
            {formatSeoulDateTime(caseDetail.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-slate-500">마지막 진단 일시</span>
          <span className="font-medium text-slate-800">
            {formatSeoulDateTime(caseDetail.updatedAt)}
          </span>
        </div>

        {caseDetail.extraAttemptAllowance > 0 && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px]">
            ✨ 선생님께서 추가 재풀이 기회를 {caseDetail.extraAttemptAllowance}회 부여하셨습니다.
          </div>
        )}

        {caseDetail.revisionNotice && (
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-[11px]">
            ℹ️ {caseDetail.revisionNotice}
          </div>
        )}
      </div>
    </div>
  );
}
