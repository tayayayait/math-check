import React from "react";
import type { ParentPublishedReportDto } from "../../contracts/dto";
import { formatSeoulDate } from "../../domain/seoul-date";
import "./report-print.css";

export interface ReportPrintViewProps {
  report: ParentPublishedReportDto;
}

export function ReportPrintView({ report }: ReportPrintViewProps) {
  const { metricsSummary } = report;

  const formatPercentage = (val: number | null) => {
    if (val === null || isNaN(val)) return "—";
    return `${val.toFixed(1)}%`;
  };

  return (
    <div className="print-container font-sans text-neutral-900 bg-white">
      {/* 헤더 */}
      <div className="border-b-2 border-primary-600 pb-4 mb-6 print-avoid-break">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold tracking-wider text-primary-600 uppercase">
              Math Diagnosis Service · 학습 분석 리포트
            </span>
            <h1 className="text-2xl font-bold text-neutral-900 mt-1">
              수학 손글씨 풀이 AI 진단 학습 분석 리포트
            </h1>
          </div>
          <div className="text-right text-xs text-neutral-500">
            <p>발행일: {formatSeoulDate(report.publishedAt)}</p>
            <p className="mt-0.5">상태: {report.status}</p>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-sm">
          <div>
            <span className="text-neutral-500 text-xs block">학생 성명</span>
            <span className="font-semibold text-neutral-800">{report.learnerName}</span>
          </div>
          <div>
            <span className="text-neutral-500 text-xs block">분석 기간</span>
            <span className="font-semibold text-neutral-800">
              {formatSeoulDate(report.fromDate)} ~ {formatSeoulDate(report.toDate)}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 text-xs block">분석 문제 수</span>
            <span className="font-semibold text-neutral-800">
              {metricsSummary.totalOriginalProblems}문항
            </span>
          </div>
        </div>
      </div>

      {/* 3대 핵심 요약 지표 */}
      <div className="mb-6 print-avoid-break">
        <h2 className="text-base font-bold text-neutral-800 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-600" />
          핵심 학습 성취도 지표
        </h2>
        <div className="print-metric-grid grid grid-cols-3 gap-3">
          <div className="print-metric-item border border-neutral-200 rounded-lg p-3 bg-neutral-50">
            <span className="text-xs font-medium text-neutral-500 block">확정 분석 문제 수</span>
            <p className="text-xl font-bold text-neutral-900 mt-1">
              {metricsSummary.totalOriginalProblems}
              <span className="text-xs font-normal text-neutral-600 ml-1">문항</span>
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {metricsSummary.totalOriginalProblems < 3
                ? "※ 표본 3건 미만 (자료 부족)"
                : "직접 손글씨 풀이 문항"}
            </p>
          </div>

          <div className="print-metric-item border border-neutral-200 rounded-lg p-3 bg-neutral-50">
            <span className="text-xs font-medium text-neutral-500 block">최초 정답률</span>
            <p className="text-xl font-bold text-primary-700 mt-1">
              {formatPercentage(metricsSummary.initialAccuracyPercent)}
            </p>
            <p className="text-xs text-neutral-500 mt-1">1차 풀이 정답 비율</p>
          </div>

          <div className="print-metric-item border border-neutral-200 rounded-lg p-3 bg-neutral-50">
            <span className="text-xs font-medium text-neutral-500 block">재풀이 완료율</span>
            <p className="text-xl font-bold text-success-700 mt-1">
              {formatPercentage(metricsSummary.retrySuccessRatePercent)}
            </p>
            <p className="text-xs text-neutral-500 mt-1">오답 힌트 학습 후 해결 비율</p>
          </div>
        </div>
      </div>

      {/* 집중 보완 취약 개념 */}
      {metricsSummary.vulnerableConcepts && metricsSummary.vulnerableConcepts.length > 0 && (
        <div className="mb-6 print-avoid-break">
          <h2 className="text-base font-bold text-neutral-800 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-warning-600" />
            주요 집중 보완 개념
          </h2>
          <div className="flex flex-wrap gap-2">
            {metricsSummary.vulnerableConcepts.slice(0, 3).map((concept, idx) => (
              <span
                key={idx}
                className="text-xs px-3 py-1.5 bg-warning-50 text-warning-800 border border-warning-200 rounded-lg font-semibold"
              >
                #{concept}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 교사 종합 총평 */}
      <div className="mb-6 print-card border border-neutral-200 rounded-lg p-4 bg-white">
        <h2 className="text-base font-bold text-neutral-800 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-600" />
          선생님의 학습 성장 총평
        </h2>
        <div className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">
          {report.teacherComment}
        </div>
      </div>

      {/* 가정 연계 지도 대화 가이드 */}
      <div className="mb-6 print-card border border-neutral-200 rounded-lg p-4 bg-white print-avoid-break">
        <h2 className="text-base font-bold text-neutral-800 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success-600" />
          가정 연계 대화 가이드
        </h2>
        <p className="text-xs text-neutral-500 mb-3">
          가정에서 자녀와 함께 다음 질문을 중심으로 편안하게 대화를 나눠보세요.
        </p>
        <div className="space-y-2">
          {report.homeQuestions.map((q, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-2.5 bg-neutral-50 rounded border border-neutral-200 text-sm"
            >
              <span className="font-bold text-primary-600 text-xs px-1.5 py-0.5 bg-primary-100 rounded">
                Q{idx + 1}
              </span>
              <p className="text-neutral-800 leading-snug">{q}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 유의사항 및 기준 */}
      <div className="text-xs text-neutral-500 border-t border-neutral-200 pt-3 space-y-1 print-avoid-break">
        <p>
          ※ 본 리포트는 발행 시점({formatSeoulDate(report.publishedAt)}) 기준 유효하게 확정된 진단
          데이터를 바탕으로 생성된 고정 스냅샷입니다.
        </p>
        <p>
          ※ 재풀이 상태 및 학습 이력은 리포트 작성일 기준이며, 기간 이후의 추가 학습 내용은 반영되지
          않습니다.
        </p>
        <p>※ 순위, 학원 평균 등 상대적 비교는 제공하지 않으며 학생 개별 성장에 초점을 맞춥니다.</p>
      </div>

      {/* 인쇄 전용 워터마크 푸터 */}
      <div className="print-watermark-footer">
        [대외비] 본 문서는 보호자 및 학생 학습 지도를 위한 개인 문서입니다. 무단 배포 및 공유를
        금합니다.
      </div>
    </div>
  );
}
