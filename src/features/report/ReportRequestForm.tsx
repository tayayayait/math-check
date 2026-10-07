/**
 * 리포트 요청 등록 폼 모달 컴포넌트
 * features/report/ReportRequestForm.tsx
 */

import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { validateReportDateRange } from "../../domain/report-policy";
import { getSeoulTodayString } from "../../domain/seoul-date";

interface ReportRequestFormProps {
  learners: Array<{ learnerId: string; name: string }>;
  defaultLearnerId?: string;
  isTeacher?: boolean;
  onClose: () => void;
  onSubmit: (data: {
    learnerId: string;
    fromDate: string;
    toDate: string;
    oralMemo?: string;
  }) => Promise<void>;
}

export function ReportRequestForm({
  learners,
  defaultLearnerId,
  isTeacher = false,
  onClose,
  onSubmit,
}: ReportRequestFormProps) {
  const todayStr = getSeoulTodayString();

  const [learnerId, setLearnerId] = useState(defaultLearnerId || (learners[0]?.learnerId ?? ""));
  const [periodPreset, setPeriodPreset] = useState<"7D" | "30D" | "CUSTOM">("30D");

  // 기본 30일 계산
  const defaultFrom30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]!;
  const [fromDate, setFromDate] = useState(defaultFrom30);
  const [toDate, setToDate] = useState(todayStr);

  const [oralMemo, setOralMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePresetChange = (preset: "7D" | "30D" | "CUSTOM") => {
    setPeriodPreset(preset);
    const now = Date.now();
    if (preset === "7D") {
      const from = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
      setFromDate(from);
      setToDate(todayStr);
    } else if (preset === "30D") {
      const from = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
      setFromDate(from);
      setToDate(todayStr);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnerId) {
      setErrorMsg("학생을 선택해 주세요.");
      return;
    }

    const dateRes = validateReportDateRange(fromDate, toDate);
    if (!dateRes.valid) {
      setErrorMsg(dateRes.reason || "날짜 범위를 확인해 주세요.");
      return;
    }

    if (isTeacher && oralMemo.trim().length > 0 && oralMemo.trim().length < 10) {
      setErrorMsg("구두 요청 경로는 최소 10자 이상 구체적으로 입력해 주세요.");
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        learnerId,
        fromDate,
        toDate,
        ...(oralMemo.trim() ? { oralMemo: oralMemo.trim() } : {}),
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "요청에 실패했습니다.";
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isTeacher ? "리포트 수기/구두 요청 등록" : "학습 분석 리포트 발행 요청"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              지정된 기간 동안의 손글씨 풀이 분석 지표를 바탕으로 리포트를 생성합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 학생 선택 */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">대상 학생</label>
            <select
              value={learnerId}
              onChange={(e) => setLearnerId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
            >
              {learners.map((l) => (
                <option key={l.learnerId} value={l.learnerId}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* 기간 선택 프리셋 */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">분석 기간 설정</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePresetChange("7D")}
                className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                  periodPreset === "7D"
                    ? "bg-blue-50 border-blue-600 text-blue-700"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                최근 7일
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange("30D")}
                className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                  periodPreset === "30D"
                    ? "bg-blue-50 border-blue-600 text-blue-700"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                최근 30일
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange("CUSTOM")}
                className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                  periodPreset === "CUSTOM"
                    ? "bg-blue-50 border-blue-600 text-blue-700"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                직접 설정 (최대 90일)
              </button>
            </div>

            {/* 날짜 입력창 */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">시작일</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setPeriodPreset("CUSTOM");
                    setFromDate(e.target.value);
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">종료일</span>
                <input
                  type="date"
                  value={toDate}
                  max={todayStr}
                  onChange={(e) => {
                    setPeriodPreset("CUSTOM");
                    setToDate(e.target.value);
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* 교사 구두 요청 메모 */}
          {isTeacher && (
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">
                구두/유선 요청 경로 메모 (선택, 10~300자)
              </label>
              <textarea
                value={oralMemo}
                onChange={(e) => setOralMemo(e.target.value)}
                placeholder="예: 2026-10-06 학부모 유선 통화 시 중간고사 대비 종합 분석 리포트 발행 요청 접수."
                className="w-full p-2.5 h-20 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 text-xs"
                maxLength={300}
              />
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-red-600 font-semibold p-2 bg-red-50 rounded-lg">
              ⚠️ {errorMsg}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              취소
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-5"
            >
              {isSubmitting ? "처리 중..." : "리포트 요청 생성"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
