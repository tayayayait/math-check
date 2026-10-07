import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useAppRepository } from "../../services/data-provider";
import { DiagnosisReviewForm } from "./DiagnosisReviewForm";
import { RevisionHistory, type AuditRecord } from "./RevisionHistory";
import { VersionConflictDialog } from "./VersionConflictDialog";
import { ErrorRegionOverlay } from "../../components/app/ErrorRegionOverlay";
import { WorkLineList } from "../student/WorkLineList";
import { AppErrorState } from "../../components/app/AppErrorState";
import { CASE_STATUS_LABELS, VERDICT_LABELS } from "../../domain/status-labels";
import { isSuccessResponse } from "../../contracts/errors";
import type { TeacherCaseDto } from "../../contracts/dto";
import type { Verdict, ErrorType, ConceptId } from "../../contracts/domain";

export function TeacherCasePage() {
  const { caseId } = useParams({ strict: false }) as { caseId: string };
  const repo = useAppRepository();

  const [caseData, setCaseData] = useState<TeacherCaseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 사진 보기 모드: 'ORIGINAL' | 'CLEANED'
  const [photoMode, setPhotoMode] = useState<"ORIGINAL" | "CLEANED">("ORIGINAL");

  // 저장 중 상태
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 버전 충돌 모달
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [latestVersionOnConflict, setLatestVersionOnConflict] = useState(1);

  const loadCase = useCallback(async () => {
    if (!caseId) return;
    setIsLoading(true);
    const res = await repo.getTeacherCase(caseId);
    if (isSuccessResponse(res)) {
      setCaseData(res.data);
      setErrorMessage(null);
    } else {
      setErrorMessage(res.error.message || "해당 진단 건을 조회할 수 없습니다.");
    }
    setIsLoading(false);
  }, [repo, caseId]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  // 1. 확인만 저장 (변경 없이 승인)
  const handleConfirmOnly = async () => {
    if (!caseData) return;
    setIsSubmitting(true);
    try {
      const res = await repo.saveTeacherReview({
        caseId: caseData.caseId,
        attemptId: caseData.currentAttemptId,
        expectedVersion: caseData.resultVersion,
        verdict: caseData.verdict,
        errorType: caseData.errorType ?? "UNKNOWN",
        conceptId: caseData.conceptId ?? "UNKNOWN",
        errorRegion: caseData.errorRegion ?? null,
        publicStudentMessage: caseData.studentMessage || "선생님이 진단 결과를 확인하였습니다.",
        internalTeacherMemo: "교사가 AI의 자동 진단 결과를 원문 대조하여 승인함.",
        overrideHints: caseData.allHints,
        idempotencyKey: crypto.randomUUID(),
      });

      if (isSuccessResponse(res)) {
        await loadCase();
        alert("진단 결과가 승인되어 학생에게 공개되었습니다.");
      } else if (res.error.code === "VERSION_CONFLICT") {
        setLatestVersionOnConflict(caseData.resultVersion + 1);
        setConflictModalOpen(true);
      } else {
        alert(res.error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. 수정 사항 저장
  const handleSaveCorrection = async (formData: {
    verdict: Verdict;
    firstErrorLineId: string | null;
    errorType: ErrorType | undefined;
    conceptId: ConceptId | undefined;
    studentMessage: string;
    hints: string[];
    correctionReason: string;
    errorBbox: { x: number; y: number; w: number; h: number } | null;
  }) => {
    if (!caseData) return;
    setIsSubmitting(true);
    try {
      const res = await repo.saveTeacherReview({
        caseId: caseData.caseId,
        attemptId: caseData.currentAttemptId,
        expectedVersion: caseData.resultVersion,
        verdict: formData.verdict,
        errorType: formData.errorType ?? "UNKNOWN",
        conceptId: formData.conceptId ?? "UNKNOWN",
        errorRegion: formData.errorBbox
          ? { lineId: formData.firstErrorLineId, bbox: formData.errorBbox }
          : null,
        publicStudentMessage: formData.studentMessage,
        internalTeacherMemo: formData.correctionReason,
        overrideHints: formData.hints,
        idempotencyKey: crypto.randomUUID(),
      });

      if (isSuccessResponse(res)) {
        await loadCase();
        alert("선생님의 수정 진단 결과가 저장되고 학생 화면에 반영되었습니다.");
      } else if (res.error.code === "VERSION_CONFLICT") {
        setLatestVersionOnConflict(caseData.resultVersion + 1);
        setConflictModalOpen(true);
      } else {
        alert(res.error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. 직접 지도 종결
  const handleCloseTeacher = async (closeReason: string) => {
    if (!caseData) return;
    setIsSubmitting(true);
    try {
      const res = await repo.closeByTeacher({
        caseId: caseData.caseId,
        expectedVersion: caseData.resultVersion,
        reason: closeReason,
        idempotencyKey: crypto.randomUUID(),
      });

      if (isSuccessResponse(res)) {
        await loadCase();
        alert("직접 지도 완료로 해당 문제가 종결되었습니다.");
      } else {
        alert(res.error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. 추가 재풀이 기회 허용
  const handleGrantExtraAttempt = async (reason: string) => {
    if (!caseData) return;
    setIsSubmitting(true);
    try {
      const res = await repo.grantExtraAttempt({
        caseId: caseData.caseId,
        expectedVersion: caseData.resultVersion,
        reason,
        idempotencyKey: crypto.randomUUID(),
      });

      if (isSuccessResponse(res)) {
        await loadCase();
        alert("학생에게 1회의 추가 재풀이 기회가 부여되었습니다.");
      } else {
        alert(res.error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        검수 대상 진단 내역을 불러오고 있습니다...
      </div>
    );
  }

  if (errorMessage || !caseData) {
    return (
      <AppErrorState
        status={404}
        title="검수 문제를 찾을 수 없습니다"
        description={errorMessage || "접근 권한이 없거나 존재하지 않는 문제 건입니다."}
        actionText="검수 목록으로 돌아가기"
        actionHref="/teacher/reviews"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 상단 브레드크럼 및 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/teacher/reviews" className="hover:text-blue-600">
              검수 대기열
            </Link>
            <span>›</span>
            <span>{caseData.bookTitle}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            진단 결과 검수 및 피드백 지도
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {caseData.evaluatedCount}회 시도
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg">
            상태: {CASE_STATUS_LABELS[caseData.caseStatus]}
          </span>
        </div>
      </div>

      {/* 2열 반응형 레이아웃 (1280px 이상: 2열, 이하: 1열 순차) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* 좌측: 사진 미리보기 + 인식문 + 독립 기준 판단 비교 (5열) */}
        <div className="xl:col-span-5 space-y-5">
          {/* 사진 뷰어 카드 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">학생 손글씨 풀이 사진</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPhotoMode("ORIGINAL")}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                    photoMode === "ORIGINAL"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  원본 사진
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoMode("CLEANED")}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                    photoMode === "CLEANED"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  정제된 사진
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-900 flex items-center justify-center min-h-[300px] max-h-[440px] relative overflow-hidden">
              <div className="relative max-h-full max-w-full flex items-center justify-center">
                <img
                  src="/demo/sample-work.svg"
                  alt="학생 풀이"
                  className="max-h-[400px] max-w-full object-contain rounded"
                />
                {/* 오류 영역 오버레이 */}
                <ErrorRegionOverlay errorRegion={caseData.errorRegion} />
              </div>
            </div>
          </div>

          {/* 인식된 풀이 줄 목록 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-800">인식된 풀이 줄</h4>
            <WorkLineList lines={caseData.recognizedLines} errorRegion={caseData.errorRegion} />
          </div>

          {/* 교사용 기준 답 및 독립 검증 비교 카드 (교사 전용) */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 shadow-sm space-y-2 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-indigo-200/60">
              <span className="font-bold text-indigo-900">
                📚 교사 전용 독립 기준 풀이 (정답 모델)
              </span>
              <span className="px-2 py-0.5 bg-indigo-200/80 text-indigo-900 text-[10px] font-bold rounded">
                비공개 모델
              </span>
            </div>
            <p className="text-indigo-800">
              <strong>기준 정답:</strong> x = 3
            </p>
            <p className="text-indigo-800">
              <strong>표준 풀이 단계:</strong> 3x = 14 - 5 → 3x = 9 → x = 3
            </p>
            <p className="text-indigo-700 text-[11px] pt-1">
              * 학생 풀이: 3x = 14 + 5 (2단계 부호 오반영 확인)
            </p>
          </div>

          {/* 감사 이력 */}
          <RevisionHistory history={caseData.auditHistory as AuditRecord[]} />
        </div>

        {/* 우측: 진단 검수 및 피드백 폼 (7열) */}
        <div className="xl:col-span-7 space-y-5">
          <DiagnosisReviewForm
            caseData={caseData}
            onConfirmOnly={handleConfirmOnly}
            onSaveCorrection={handleSaveCorrection}
            onCloseTeacher={handleCloseTeacher}
            onGrantExtraAttempt={handleGrantExtraAttempt}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      {/* 동시 검수 버전 충돌 모달 */}
      <VersionConflictDialog
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        onReloadAndReapply={async () => {
          setConflictModalOpen(false);
          await loadCase();
        }}
        latestVersion={latestVersionOnConflict}
      />
    </div>
  );
}
