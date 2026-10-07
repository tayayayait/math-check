/**
 * 교사용 학습 분석 리포트 편집 및 정식 발행 화면
 * features/report/ReportEditorPage.tsx
 */

import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "@tanstack/react-router";
import { useAppRepository } from "../../services/data-provider";
import { isSuccessResponse } from "../../contracts/errors";
import type { ReportDraftDto } from "../../contracts/dto";
import {
  validateTeacherComment,
  validateHomeQuestions,
  canPublishReport,
  canWithdrawReport,
} from "../../domain/report-policy";
import { formatSeoulDate } from "../../domain/seoul-date";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { AppErrorState } from "../../components/app/AppErrorState";
import { ReportPreview } from "./ReportPreview";

export function ReportEditorPage() {
  const { reportId } = useParams({ strict: false }) as { reportId: string };
  const repo = useAppRepository();
  const navigate = useNavigate();

  const [report, setReport] = useState<ReportDraftDto | null>(null);
  const [activeView, setActiveView] = useState<"EDIT" | "PREVIEW">("EDIT");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 폼 입력 상태
  const [teacherComment, setTeacherComment] = useState("");
  const [homeQuestions, setHomeQuestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 회수 모달 상태
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");

  const loadReport = useCallback(async () => {
    if (!reportId) return;
    setIsLoading(true);
    const res = await repo.getReportDraft(reportId);
    if (isSuccessResponse(res)) {
      setReport(res.data);
      setTeacherComment(res.data.teacherComment);
      setHomeQuestions(res.data.homeQuestions);
      setErrorMessage(null);
    } else {
      setErrorMessage(res.error.message || "해당 리포트를 불러올 수 없습니다.");
    }
    setIsLoading(false);
  }, [repo, reportId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const commentValidation = validateTeacherComment(teacherComment);
  const questionsValidation = validateHomeQuestions(homeQuestions);
  const isPublishable = report
    ? canPublishReport(report.status, teacherComment, homeQuestions)
    : false;

  // 질문 핸들러
  const handleAddQuestion = () => {
    if (homeQuestions.length >= 3) return;
    setHomeQuestions([...homeQuestions, ""]);
  };

  const handleUpdateQuestion = (index: number, val: string) => {
    const updated = [...homeQuestions];
    updated[index] = val;
    setHomeQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    if (homeQuestions.length <= 1) return;
    setHomeQuestions(homeQuestions.filter((_, idx) => idx !== index));
  };

  // 초안 저장
  const handleSaveDraft = async () => {
    if (!report) return;
    setIsSubmitting(true);
    try {
      const res = await repo.saveReportDraft({
        reportId: report.reportId,
        reportVersion: report.reportVersion,
        teacherComment,
        homeQuestions,
        idempotencyKey: crypto.randomUUID(),
      });

      if (isSuccessResponse(res)) {
        alert("리포트 초안이 안전하게 저장되었습니다.");
        await loadReport();
      } else {
        alert(res.error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 정식 발행
  const handlePublish = async () => {
    if (!report || !isPublishable) return;
    const confirmed = window.confirm(
      "리포트를 정식 발행하시겠습니까? 발행 후에는 학부모 화면에 공개되며 불변 스냅샷으로 고정됩니다.",
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      // 1. 먼저 최신 내용 저장
      await repo.saveReportDraft({
        reportId: report.reportId,
        reportVersion: report.reportVersion,
        teacherComment,
        homeQuestions,
        idempotencyKey: crypto.randomUUID(),
      });

      // 2. 정식 발행
      const pubRes = await repo.publishReport({
        reportId: report.reportId,
        reportVersion: report.reportVersion + 1,
        idempotencyKey: crypto.randomUUID(),
      });

      if (isSuccessResponse(pubRes)) {
        alert("리포트가 정식 발행되어 학부모 화면에 공개되었습니다.");
        await loadReport();
      } else {
        alert(pubRes.error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 수동 회수
  const handleWithdraw = async () => {
    if (!report || withdrawReason.trim().length < 10) return;
    setIsSubmitting(true);
    try {
      const res = await repo.withdrawReport({
        reportId: report.reportId,
        reason: withdrawReason.trim(),
        idempotencyKey: crypto.randomUUID(),
      });

      if (isSuccessResponse(res)) {
        alert("리포트가 정상적으로 회수되었습니다. 학부모 화면에서 열람이 차단됩니다.");
        setIsWithdrawOpen(false);
        await loadReport();
      } else {
        alert(res.error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        리포트 데이터를 불러오는 중입니다...
      </div>
    );
  }

  if (errorMessage || !report) {
    return (
      <AppErrorState
        status={404}
        title="리포트 조회 실패"
        description={errorMessage || "해당 리포트를 찾을 수 없습니다."}
        actionText="리포트 목록으로"
        actionHref="/teacher/reports"
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* 상단 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 font-bold">리포트 에디터</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                report.status === "PUBLISHED"
                  ? "bg-green-100 text-green-800"
                  : report.status === "DRAFT"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
              }`}
            >
              {report.status} (v{report.reportVersion})
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {report.learnerName} 학생 학습 분석 리포트 작성
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            분석 기간: {formatSeoulDate(report.fromDate)} ~ {formatSeoulDate(report.toDate)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* 편집 / 미리보기 탭 토글 */}
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveView("EDIT")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeView === "EDIT" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              초안 편집
            </button>
            <button
              type="button"
              onClick={() => setActiveView("PREVIEW")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeView === "PREVIEW" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              학부모 화면 미리보기
            </button>
          </div>

          <Link to="/teacher/reports">
            <Button variant="outline" size="sm" className="text-xs">
              ← 목록으로
            </Button>
          </Link>
        </div>
      </div>

      {activeView === "PREVIEW" ? (
        /* 학부모 화면 미리보기 */
        <div className="space-y-4">
          <ReportPreview
            report={{
              ...report,
              teacherComment,
              homeQuestions,
            }}
          />
        </div>
      ) : (
        /* 초안 편집 폼 */
        <div className="space-y-6">
          {/* 1. 지표 요약 카드 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              자동 집계 분석 지표
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[11px] text-slate-400 block">제출 원문 문제</span>
                <strong className="text-lg font-bold text-slate-800">
                  {report.metricsSummary.totalOriginalProblems}개
                </strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[11px] text-slate-400 block">최초 정답률</span>
                <strong className="text-lg font-bold text-slate-800">
                  {report.metricsSummary.initialAccuracyPercent !== null
                    ? `${report.metricsSummary.initialAccuracyPercent.toFixed(1)}%`
                    : "—"}
                </strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[11px] text-slate-400 block">재풀이 성공률</span>
                <strong className="text-lg font-bold text-blue-600">
                  {report.metricsSummary.retrySuccessRatePercent !== null
                    ? `${report.metricsSummary.retrySuccessRatePercent.toFixed(1)}%`
                    : "—"}
                </strong>
              </div>
            </div>
          </div>

          {/* 2. 교사 총평 작성 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  선생님 학습 성장 총평 (필수 20~1000자)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  단원 개념 습득도, 풀이 태도, 오답 극복 노력 등을 정성스럽게 작성해 주세요.
                  (순위·평균 언급 금지)
                </p>
              </div>
              <span className="text-xs text-slate-400">{teacherComment.length} / 1000자</span>
            </div>

            <Textarea
              value={teacherComment}
              onChange={(e) => setTeacherComment(e.target.value)}
              placeholder="예: 학생이 일차방정식 단원에서 이항 시 부호 변경 원리를 꼼꼼하게 점검하고 있으며, 오답 후 재풀이 시 100% 정답에 도달하는 끈기 있는 학습 태도를 보여주고 있습니다."
              className="min-h-[140px] text-xs leading-relaxed"
              maxLength={1000}
            />

            {!commentValidation.valid && (
              <p className="text-xs text-red-600 font-semibold">⚠️ {commentValidation.reason}</p>
            )}
          </div>

          {/* 3. 가정 연계 질문 작성 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  가정 연계 대화 질문 (1~3개, 각 10~200자)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  부모님이 가정에서 자녀와 수학에 대해 따뜻하게 대화를 나눌 수 있는 질문을 제안해
                  주세요.
                </p>
              </div>

              {homeQuestions.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddQuestion}
                  className="text-xs"
                >
                  + 질문 추가
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {homeQuestions.map((q, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-xs font-bold text-slate-400 mt-2.5 w-5 text-center">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={q}
                      onChange={(e) => handleUpdateQuestion(idx, e.target.value)}
                      placeholder="예: 오늘 푼 문제 중 가장 재미있었던 방정식은 무엇이었는지 물어봐 주세요."
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500"
                      maxLength={200}
                    />
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>최소 10자 이상</span>
                      <span>{q.length} / 200자</span>
                    </div>
                  </div>
                  {homeQuestions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-xs text-slate-400 hover:text-red-600 p-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!questionsValidation.valid && (
              <p className="text-xs text-red-600 font-semibold">⚠️ {questionsValidation.reason}</p>
            )}
          </div>
        </div>
      )}

      {/* 하단 고정 액션 바 */}
      <div className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          {report.status === "PUBLISHED" ? (
            <span className="text-green-700 font-semibold">
              ✓ 이미 학부모에게 정식 발행된 리포트입니다. 필요 시 회수할 수 있습니다.
            </span>
          ) : isPublishable ? (
            <span className="text-blue-700 font-semibold">
              ✓ 총평 및 질문 규격을 모두 충족했습니다. 발행할 수 있습니다.
            </span>
          ) : (
            <span className="text-amber-700 font-semibold">
              ⚠️ 총평 20자 이상과 유효한 가정 질문(1~3개)을 작성해야 발행할 수 있습니다.
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {report.status === "PUBLISHED" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsWithdrawOpen(true)}
              disabled={isSubmitting}
              className="text-xs border-red-200 text-red-600 hover:bg-red-50"
            >
              리포트 수동 회수
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="text-xs"
              >
                초안 임시 저장
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handlePublish}
                disabled={!isPublishable || isSubmitting}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-5 shadow-sm"
              >
                {isSubmitting ? "발행 중..." : "정식 발행하기"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 수동 회수 모달 */}
      {isWithdrawOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">리포트 수동 회수</h3>
              <p className="text-xs text-slate-500 mt-1">
                회수 시 학부모 화면에서 열람이 즉시 차단됩니다. 사유를 10자 이상 작성해 주세요.
              </p>
            </div>

            <textarea
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              placeholder="예: 진단 원판정 수정으로 인한 지표 재검토 필요."
              className="w-full h-24 p-3 text-xs border border-slate-200 rounded-xl"
              maxLength={500}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsWithdrawOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                취소
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleWithdraw}
                disabled={withdrawReason.trim().length < 10 || isSubmitting}
                className="text-xs bg-red-600 hover:bg-red-700 text-white"
              >
                {isSubmitting ? "회수 처리 중..." : "회수 확정"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
