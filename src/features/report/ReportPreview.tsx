/**
 * 학습 분석 리포트 표준 미리보기 카드 컴포넌트
 * features/report/ReportPreview.tsx
 */

import React from "react";
import { formatSeoulDate } from "../../domain/seoul-date";
import type { ReportDraftDto, ParentPublishedReportDto } from "../../contracts/dto";

interface ReportPreviewProps {
  report: ReportDraftDto | ParentPublishedReportDto;
  isPrintMode?: boolean;
}

export function ReportPreview({ report, isPrintMode = false }: ReportPreviewProps) {
  const { metricsSummary } = report;

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 text-slate-800 ${
        isPrintMode ? "print-container" : "shadow-sm"
      }`}
    >
      {/* 1. 리포트 헤더 */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs text-blue-600 font-bold tracking-wide uppercase">
            수학 손글씨 풀이 AI 진단 학습 분석 리포트
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            {report.learnerName} 학생의 수학 학습 분석 결과
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            분석 기간: {formatSeoulDate(report.fromDate)} ~ {formatSeoulDate(report.toDate)}
          </p>
        </div>

        <div className="text-right text-xs text-slate-400">
          <span className="block">
            발행/작성일:{" "}
            {formatSeoulDate("publishedAt" in report ? report.publishedAt : report.updatedAt)}
          </span>
          <span className="text-[11px]">
            상태: <strong className="text-slate-700">{report.status}</strong>
          </span>
        </div>
      </div>

      {/* 2. 3대 핵심 요약 지표 카드 */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          기간 내 핵심 성취도 지표
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 지표 1: 분석 및 풀이 문제 수 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 font-medium">분석 문제 수</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {metricsSummary.totalOriginalProblems}
              </span>
              <span className="text-xs text-slate-500">문항</span>
            </div>
            <p className="text-[11px] text-slate-400">직접 손글씨로 푼 원문 문항</p>
          </div>

          {/* 지표 2: 최초 정답률 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 font-medium">최초 정답률</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {metricsSummary.initialAccuracyPercent !== null
                  ? `${metricsSummary.initialAccuracyPercent.toFixed(1)}%`
                  : "—"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">첫 시도에서 정확히 해결한 비율</p>
          </div>

          {/* 지표 3: 재풀이 완료율 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-xs text-slate-500 font-medium">오답 극복 및 재풀이율</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-blue-600 tabular-nums">
                {metricsSummary.retrySuccessRatePercent !== null
                  ? `${metricsSummary.retrySuccessRatePercent.toFixed(1)}%`
                  : "—"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">힌트를 보고 재도전하여 완수한 비율</p>
          </div>
        </div>
      </div>

      {/* 3. 취약 및 집중 학습 개념 */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          주요 점검 개념
        </h3>
        <div className="flex flex-wrap gap-2">
          {metricsSummary.vulnerableConcepts.length > 0 ? (
            metricsSummary.vulnerableConcepts.map((concept, idx) => (
              <span
                key={idx}
                className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-semibold"
              >
                #{concept}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">
              특별한 취약 개념이 검출되지 않았습니다. (양호)
            </span>
          )}
        </div>
      </div>

      {/* 4. 선생님의 정성 총평 */}
      <div className="p-5 bg-blue-50/40 border border-blue-100 rounded-2xl space-y-2">
        <h3 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
          <span>👩‍🏫</span> 선생님의 학습 성장 총평
        </h3>
        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
          {report.teacherComment}
        </p>
      </div>

      {/* 5. 가정 연계 질문 및 대화 제안 */}
      <div className="p-5 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-2.5">
        <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
          <span>💬</span> 가정에서 함께 나눠볼 대화 질문
        </h3>
        <div className="space-y-2">
          {report.homeQuestions.map((q, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-amber-950">
              <span className="font-bold text-amber-700">{idx + 1}.</span>
              <p className="leading-relaxed">{q}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 집계 기준 설명 안내 */}
      <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-400 flex items-center justify-between">
        <span>* 본 리포트의 지표는 서울 표준시 기준 작성 시점의 불변 스냅샷입니다.</span>
        <span>최대 힌트 열람 단계: H{metricsSummary.maxHintUsageLevel}</span>
      </div>
    </div>
  );
}
