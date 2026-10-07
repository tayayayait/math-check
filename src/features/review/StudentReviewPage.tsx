/**
 * 학생 맞춤 복습 문제 확인 및 손글씨 풀이 제출 화면
 * features/review/StudentReviewPage.tsx
 */

import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "@tanstack/react-router";
import { useAppRepository } from "../../services/data-provider";
import { isSuccessResponse } from "../../contracts/errors";
import type { ReviewItemCandidateDto } from "../../contracts/dto";
import type { PhotoRef } from "../../contracts/domain";
import { MathText } from "../../components/app/MathText";
import { PhotoPicker, type PhotoDraftItem } from "../student/PhotoPicker";
import { Button } from "../../components/ui/button";
import { AppErrorState } from "../../components/app/AppErrorState";

export function StudentReviewPage() {
  const { reviewId } = useParams({ strict: false }) as { reviewId: string };
  const repo = useAppRepository();
  const navigate = useNavigate();

  const [reviewItem, setReviewItem] = useState<ReviewItemCandidateDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 학생 풀이 사진
  const [workPhotos, setWorkPhotos] = useState<PhotoDraftItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const loadItem = useCallback(async () => {
    if (!reviewId) return;
    setIsLoading(true);
    const res = await repo.getReviewCandidate(reviewId);
    if (isSuccessResponse(res)) {
      setReviewItem(res.data);
      if (res.data.status === "COMPLETED") {
        setIsCompleted(true);
      }
      setErrorMessage(null);
    } else {
      setErrorMessage(res.error.message || "해당 복습 문제를 찾을 수 없습니다.");
    }
    setIsLoading(false);
  }, [repo, reviewId]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  const handleSubmit = async () => {
    if (!reviewItem || workPhotos.length === 0) return;
    setIsSubmitting(true);
    try {
      const mappedRefs: PhotoRef[] = workPhotos.map((p, idx) => ({
        clientPhotoId: p.id,
        purpose: "WORK",
        order: idx + 1,
        width: p.width,
        height: p.height,
        mime: p.mime,
        bytes: p.bytes,
        editedRevision: p.editedRevision,
      }));

      const res = await repo.submitStudentReview(reviewItem.reviewId, mappedRefs);
      if (isSuccessResponse(res)) {
        setIsCompleted(true);
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
        복습 문제를 불러오는 중입니다...
      </div>
    );
  }

  if (errorMessage || !reviewItem) {
    return (
      <AppErrorState
        status={404}
        title="복습 문제 불러오기 실패"
        description={errorMessage || "문제 정보를 찾을 수 없습니다."}
        actionText="학생 홈으로 돌아가기"
        actionHref="/student"
      />
    );
  }

  // 복습 완료 화면
  if (isCompleted) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-3xl mx-auto shadow-sm">
          🎉
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">복습 풀이 제출이 완료되었습니다!</h1>
          <p className="text-sm text-slate-600">
            취약 개념을 보완하기 위한 복습 문제를 멋지게 완수했습니다.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2">
          <span className="font-semibold text-slate-500 block">제출한 문제</span>
          <div className="text-sm font-medium text-slate-800">
            <MathText text={reviewItem.problemText} />
          </div>
        </div>

        <div className="flex justify-center gap-3 pt-4">
          <Link to="/student">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-6">
              학생 홈으로 돌아가기
            </Button>
          </Link>
          <Link to="/student/history">
            <Button variant="outline" className="text-xs">
              학습 기록 보기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 아직 승인되지 않았거나 반려된 경우
  if (reviewItem.status !== "AVAILABLE" && reviewItem.status !== "APPROVED") {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xl mx-auto">
          ⏳
        </div>
        <h2 className="text-lg font-bold text-slate-900">선생님의 검수가 진행 중인 문제입니다</h2>
        <p className="text-xs text-slate-500">
          선생님께서 문항의 난이도와 적합성을 검토하신 후 승인하시면 풀이를 시작할 수 있습니다.
        </p>
        <div className="pt-2">
          <Link to="/student">
            <Button variant="outline" size="sm" className="text-xs">
              학생 홈으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-16">
      {/* 상단 타이틀 */}
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div>
          <span className="text-xs text-blue-600 font-bold">오답 극복 맞춤 복습</span>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">유사 개념 복습 풀이</h1>
        </div>

        <Link to="/student">
          <Button variant="outline" size="sm" className="text-xs">
            ← 뒤로가기
          </Button>
        </Link>
      </div>

      {/* 문제 카드 */}
      <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
            단원: {reviewItem.conceptId}
          </span>
          <span className="text-xs text-slate-400">
            난이도: {reviewItem.difficulty === "EASY" ? "기초" : "표준"}
          </span>
        </div>

        <div className="py-2 text-base font-semibold text-slate-900 leading-relaxed">
          <MathText text={reviewItem.problemText} />
        </div>

        <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
          💡 종이에 풀이 과정을 차근차근 적은 후, 아래에서 사진을 찍어 제출해 주세요.
        </p>
      </div>

      {/* 손글씨 풀이 사진 촬영/업로드 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">손글씨 풀이 사진 등록</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            글씨와 수식이 잘 보이도록 밝은 곳에서 반듯하게 촬영해 주세요.
          </p>
        </div>

        <PhotoPicker
          problemPhoto={null}
          workPhotos={workPhotos}
          onProblemPhotoChange={() => {}}
          onWorkPhotosChange={setWorkPhotos}
        />
      </div>

      {/* 최종 제출 버튼 바 */}
      <div className="pt-2">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={workPhotos.length === 0 || isSubmitting}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-sm"
        >
          {isSubmitting ? "풀이 제출 중..." : "복습 풀이 제출하기"}
        </Button>
        {workPhotos.length === 0 && (
          <p className="text-center text-[11px] text-slate-400 mt-2">
            풀이 사진을 1장 이상 등록해야 제출할 수 있습니다.
          </p>
        )}
      </div>
    </div>
  );
}
