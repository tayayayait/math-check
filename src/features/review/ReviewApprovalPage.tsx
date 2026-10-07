/**
 * 교사용 복습 문제 검수 및 승인/반려 화면
 * features/review/ReviewApprovalPage.tsx
 */

import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "@tanstack/react-router";
import { useAppRepository } from "../../services/data-provider";
import { isSuccessResponse } from "../../contracts/errors";
import type { ReviewItemCandidateDto } from "../../contracts/dto";
import { DEFAULT_REVIEW_CHECKLIST, type ReviewItemChecklist } from "../../contracts/review-item";
import { ReviewChecklist } from "./ReviewChecklist";
import { ReviewCandidateForm } from "./ReviewCandidateForm";
import { canApproveReviewItem } from "../../domain/review-policy";
import { Button } from "../../components/ui/button";
import { AppErrorState } from "../../components/app/AppErrorState";

export function ReviewApprovalPage() {
  const { reviewId } = useParams({ strict: false }) as { reviewId: string };
  const repo = useAppRepository();
  const navigate = useNavigate();

  const [reviewItem, setReviewItem] = useState<ReviewItemCandidateDto | null>(null);
  const [checklist, setChecklist] = useState<ReviewItemChecklist>(DEFAULT_REVIEW_CHECKLIST);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 반려 모달 상태
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadItem = useCallback(async () => {
    if (!reviewId) return;
    setIsLoading(true);
    const res = await repo.getReviewCandidate(reviewId);
    if (isSuccessResponse(res)) {
      setReviewItem(res.data);
      setErrorMessage(null);
    } else {
      setErrorMessage(res.error.message || "해당 복습 문제를 찾을 수 없습니다.");
    }
    setIsLoading(false);
  }, [repo, reviewId]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  const handleChecklistChange = (key: keyof ReviewItemChecklist, checked: boolean) => {
    setChecklist((prev) => ({ ...prev, [key]: checked }));
  };

  const handleEditCandidate = async (updated: {
    problemText: string;
    difficulty: "BASIC" | "STANDARD";
  }) => {
    if (!reviewItem) return;
    const diffMapped: "EASY" | "MEDIUM" | "HARD" =
      updated.difficulty === "BASIC" ? "EASY" : "MEDIUM";

    const res = await repo.editReviewCandidate({
      reviewId: reviewItem.reviewId,
      expectedVersion: reviewItem.questionVersion,
      problemText: updated.problemText,
      difficulty: diffMapped,
    });

    if (isSuccessResponse(res)) {
      alert("문항 수정이 반영되어 새 버전으로 갱신되었습니다. (재검수 필요)");
      await loadItem();
    } else {
      alert(res.error.message);
    }
  };

  const handleApprove = async () => {
    if (!reviewItem) return;
    setIsSubmitting(true);
    try {
      const res = await repo.approveReviewItem({
        reviewId: reviewItem.reviewId,
        questionVersion: reviewItem.questionVersion,
        checklistPassed: true,
        idempotencyKey: crypto.randomUUID(),
      });

      if (isSuccessResponse(res)) {
        alert("복습 문제가 승인되었습니다. 원문 풀이가 완료되면 학생에게 자동 공개됩니다.");
        await loadItem();
      } else {
        alert(res.error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reviewItem || rejectReason.trim().length < 10) return;
    setIsSubmitting(true);
    try {
      const res = await repo.rejectReviewItem({
        reviewId: reviewItem.reviewId,
        questionVersion: reviewItem.questionVersion,
        reason: rejectReason.trim(),
        idempotencyKey: crypto.randomUUID(),
      });

      if (isSuccessResponse(res)) {
        alert("해당 복습 문제 후보가 반려 처리되었습니다.");
        setIsRejectOpen(false);
        await loadItem();
      } else {
        alert(res.error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        복습 문제 정보를 불러오는 중입니다...
      </div>
    );
  }

  if (errorMessage || !reviewItem) {
    return (
      <AppErrorState
        status={404}
        title="복습 문제 조회 실패"
        description={errorMessage || "문제 정보를 찾을 수 없습니다."}
        actionText="대기열로 돌아가기"
        actionHref="/teacher/reviews"
      />
    );
  }

  const isEligibleToApprove = canApproveReviewItem(
    reviewItem.status,
    checklist,
    reviewItem.validationStatus,
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* 상단 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 font-bold">복습 문제 품질 검수</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                reviewItem.status === "PENDING_APPROVAL"
                  ? "bg-amber-100 text-amber-800"
                  : reviewItem.status === "APPROVED" || reviewItem.status === "AVAILABLE"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              상태: {reviewItem.status}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            맞춤 복습 문항 승인 및 품질 점검
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            학생: <strong className="text-slate-800">{reviewItem.learnerName || "학생"}</strong> ·
            연계 원문: {reviewItem.originalProblemTitle || reviewItem.sourceCaseId} · 개념:{" "}
            {reviewItem.conceptId}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/teacher/reviews">
            <Button variant="outline" size="sm" className="text-xs">
              ← 검수 대기열로
            </Button>
          </Link>
        </div>
      </div>

      {/* 안내 알림 */}
      {reviewItem.status === "REJECTED" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
          <strong className="font-bold">❌ 반려된 복습 문항입니다.</strong>
          <p>사유: {reviewItem.rejectionReason || "교사에 의해 반려됨"}</p>
        </div>
      )}

      {reviewItem.status === "AVAILABLE" && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 space-y-1">
          <strong className="font-bold">✓ 이미 승인되어 학생에게 공개된 문항입니다.</strong>
          <p>학생이 맞춤 복습 목록에서 이 문제를 확인하고 풀이를 진행할 수 있습니다.</p>
        </div>
      )}

      {/* 1. 문항 내용 및 편집 (실시간 미리보기 포함) */}
      <ReviewCandidateForm
        initialProblemText={reviewItem.problemText}
        initialDifficulty={reviewItem.difficulty === "EASY" ? "BASIC" : "STANDARD"}
        expectedAnswer={reviewItem.expectedAnswer}
        independentVerification={reviewItem.independentVerification}
        questionVersion={reviewItem.questionVersion}
        readOnly={reviewItem.status !== "PENDING_APPROVAL"}
        onSave={handleEditCandidate}
      />

      {/* 2. 8대 품질 검수 체크리스트 */}
      <ReviewChecklist
        checklist={checklist}
        onChange={handleChecklistChange}
        readOnly={reviewItem.status !== "PENDING_APPROVAL"}
      />

      {/* 하단 결정 액션 바 */}
      {reviewItem.status === "PENDING_APPROVAL" && (
        <div className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {isEligibleToApprove ? (
              <span className="text-green-700 font-semibold">
                ✓ 8대 검수 기준을 모두 충족했습니다. 문항을 승인할 수 있습니다.
              </span>
            ) : (
              <span className="text-amber-700 font-semibold">
                ⚠️ 상단의 8개 검수 항목을 모두 통과 확인해야 승인 버튼이 활성화됩니다.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRejectOpen(true)}
              disabled={isSubmitting}
              className="text-xs border-red-200 text-red-600 hover:bg-red-50"
            >
              문항 반려
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleApprove}
              disabled={!isEligibleToApprove || isSubmitting}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-5"
            >
              {isSubmitting ? "승인 처리 중..." : "최종 승인 및 공개 설정"}
            </Button>
          </div>
        </div>
      )}

      {/* 반려 사유 모달 */}
      {isRejectOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">복습 문제 반려 사유 작성</h3>
              <p className="text-xs text-slate-500 mt-1">
                문제의 결함이나 부적합한 사유를 최소 10자 이상 구체적으로 작성해 주세요.
              </p>
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="예: 문제 조건에 누락이 있어 해가 유일하지 않습니다."
              className="w-full h-28 p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              maxLength={500}
            />

            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>최소 10자 ~ 최대 500자</span>
              <span>{rejectReason.trim().length} / 500자</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRejectOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                취소
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleReject}
                disabled={rejectReason.trim().length < 10 || isSubmitting}
                className="text-xs bg-red-600 hover:bg-red-700 text-white"
              >
                {isSubmitting ? "반려 처리 중..." : "반려 확정"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
