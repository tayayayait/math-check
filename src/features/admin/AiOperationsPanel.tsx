/**
 * AI 운영 모니터링 및 자동 진단 정책 패널
 * features/admin/AiOperationsPanel.tsx
 */

import React, { useEffect, useState, useCallback } from "react";
import type { AiOperationConfigDto } from "../../contracts/admin";
import { evaluateBudgetThreshold } from "../../domain/admin-policy";
import { useAppRepository } from "../../services/data-provider";
import { isSuccessResponse } from "../../contracts/errors";
import { Button } from "../../components/ui/button";

export function AiOperationsPanel() {
  const repo = useAppRepository();
  const [config, setConfig] = useState<AiOperationConfigDto | null>(null);
  const [loading, setLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    const res = await repo.getAiOperationsConfig();
    if (isSuccessResponse(res)) {
      setConfig(res.data);
    }
    setLoading(false);
  }, [repo]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleToggleRelease = async () => {
    if (!config) return;
    const nextVal = !config.aiReleaseEnabled;
    const res = await repo.updateAiReleaseToggle(nextVal);
    if (isSuccessResponse(res)) {
      setConfig({ ...config, aiReleaseEnabled: nextVal });
    }
  };

  if (loading || !config) {
    return <div className="p-8 text-center text-xs text-slate-400">AI 설정 로딩 중...</div>;
  }

  const budgetEval = evaluateBudgetThreshold(config.currentMonthSpentKrw, config.monthlyBudgetKrw);

  return (
    <div className="space-y-6">
      {/* 1. 상단 AI 자동 공개 제어 및 상태 토글 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase">
            AI Diagnosis Release Gate
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">
            AI 진단 결과 자동 공개 정책 (AI_RELEASE_ENABLED)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            토글을 끄면 모든 AI 진단 결과가 학생 화면에 즉시 공개되지 않고{" "}
            <strong>선생님의 수동 확인(WAITING_TEACHER)</strong> 대기열로 이동합니다.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-700">
            {config.aiReleaseEnabled ? "자동 공개 활성" : "자동 공개 차단"}
          </span>
          <button
            type="button"
            onClick={handleToggleRelease}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              config.aiReleaseEnabled ? "bg-blue-600" : "bg-slate-300"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                config.aiReleaseEnabled ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. 월간 AI API 예산 및 비용 모니터링 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              월간 AI 분석 운영 예산 모니터링 (합성 예시)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              월 100,000원 기준 80% 도달 시 경고, 100% 초과 시 신규 자동 분석이 중지됩니다.
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              budgetEval.status === "NORMAL"
                ? "bg-green-100 text-green-800"
                : budgetEval.status === "WARNING"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {budgetEval.status === "NORMAL" && "정상 범위"}
            {budgetEval.status === "WARNING" && "예산 80% 경고"}
            {budgetEval.status === "EXCEEDED" && "예산 한도 초과 (중지)"}
          </span>
        </div>

        {/* 진행 바 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600">
              현재 누적 사용액: {config.currentMonthSpentKrw.toLocaleString()}원
            </span>
            <span className="text-slate-400">
              한도: {config.monthlyBudgetKrw.toLocaleString()}원 (
              {(budgetEval.usageRatio * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetEval.status === "NORMAL"
                  ? "bg-blue-600"
                  : budgetEval.status === "WARNING"
                    ? "bg-amber-500"
                    : "bg-red-600"
              }`}
              style={{ width: `${Math.min(budgetEval.usageRatio * 100, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{budgetEval.message}</p>
        </div>

        {/* 모델 및 파이프라인 정보 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] text-slate-400 block font-medium">활성 진단 모델</span>
            <strong className="text-xs text-slate-800">{config.activeModelName}</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] text-slate-400 block font-medium">프롬프트 설정 버전</span>
            <strong className="text-xs text-slate-800 font-mono">{config.promptVersion}</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] text-slate-400 block font-medium">
              당월 총 진단 호출 수
            </span>
            <strong className="text-xs text-slate-800">{config.totalDiagnosisCalls}회</strong>
          </div>
        </div>
      </div>

      {/* 3. 학년 및 단원별 자동 진단 지원 범위 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">학년/단원별 진단 지원 상태</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            현재 안정화된 중1 일차방정식 단원만 자동 지원(AUTO_ENABLED)되며, 타 학년은 교사 수동
            검토 경로로 운영됩니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {config.supportedUnits.map((u) => (
            <div
              key={u.unitId}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-900">{u.unitName}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                  {u.unitId}
                </span>
              </div>
              <div className="mt-3">
                <span
                  className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${
                    u.status === "AUTO_ENABLED"
                      ? "bg-green-100 text-green-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {u.status === "AUTO_ENABLED" ? "✓ 자동 진단 지원" : "교사 수동 검토만 지원"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
