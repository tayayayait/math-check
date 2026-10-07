import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "@tanstack/react-router";
import { Button } from "../../components/ui/button";
import { useAppRepository } from "../../services/data-provider";
import { PhotoPicker, type PhotoDraftItem } from "./PhotoPicker";
import { isSuccessResponse } from "../../contracts/errors";
import type { StudentCaseDto } from "../../contracts/dto";
import type { PhotoRef, RevealedHintItem } from "../../contracts/domain";

export function RetryPage() {
  const { caseId } = useParams({ strict: false }) as { caseId: string };
  const navigate = useNavigate();
  const repo = useAppRepository();

  const [caseDetail, setCaseDetail] = useState<StudentCaseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 재풀이 풀이 사진 목록 (1~3장)
  const [workPhotos, setWorkPhotos] = useState<PhotoDraftItem[]>([]);

  // 필수 체크박스
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [legibilityChecked, setLegibilityChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadOriginal() {
      if (!caseId) return;
      setIsLoading(true);
      const res = await repo.getStudentCase(caseId);
      if (isSuccessResponse(res)) {
        setCaseDetail(res.data);
      } else {
        setErrorMessage(res.error.message || "문제를 불러올 수 없습니다.");
      }
      setIsLoading(false);
    }
    loadOriginal();
  }, [repo, caseId]);

  const handleWorkPhotosChange = (photos: PhotoDraftItem[]) => {
    setWorkPhotos(photos);
    setPrivacyChecked(false);
    setLegibilityChecked(false);
  };

  const handleSubmitRetry = async () => {
    if (!caseDetail || workPhotos.length === 0) return;
    if (!privacyChecked || !legibilityChecked) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const workPhotoRefs: PhotoRef[] = workPhotos.map((w, idx) => ({
        clientPhotoId: w.id,
        purpose: "WORK",
        order: idx + 1,
        width: w.width,
        height: w.height,
        mime: w.mime,
        bytes: w.bytes,
        editedRevision: w.editedRevision,
      }));

      const maxRevision = Math.max(...workPhotos.map((w) => w.editedRevision));
      const idempotencyKey = `retry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const res = await repo.createRetry({
        caseId: caseDetail.caseId,
        workPhotoRefs,
        confirmedPhotoRevision: maxRevision,
        privacyChecked: true,
        legibilityChecked: true,
        idempotencyKey,
      });

      if (isSuccessResponse(res)) {
        navigate({ to: `/student/cases/${caseDetail.caseId}` });
      } else {
        setErrorMessage(res.error.message || "재풀이 접수 중 오류가 발생했습니다.");
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrorMessage("재풀이 처리 중 오류: " + (err instanceof Error ? err.message : String(err)));
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">문제를 불러오고 있습니다...</div>
    );
  }

  if (errorMessage && !caseDetail) {
    return (
      <div className="p-6 bg-red-50 text-red-700 text-center rounded-xl space-y-3">
        <p>{errorMessage}</p>
        <Link to="/student">
          <Button variant="outline" size="sm">
            학생 홈으로 돌아가기
          </Button>
        </Link>
      </div>
    );
  }

  if (!caseDetail) return null;

  const canSubmit = workPhotos.length >= 1 && privacyChecked && legibilityChecked && !isSubmitting;

  return (
    <div className="space-y-6">
      <div className="pb-1 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          문제 다시 풀기 (재풀이 제출)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {caseDetail.bookTitle} ({caseDetail.page}쪽 #{caseDetail.problemNo})
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* 1. 이전 열람 힌트 요약 아코디언 */}
      {caseDetail.revealedHints.length > 0 && (
        <details className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-xs group">
          <summary className="font-bold text-amber-900 cursor-pointer flex items-center justify-between">
            <span>💡 이전에 열람한 맞춤 힌트 보기 ({caseDetail.revealedHints.length}개)</span>
            <span className="text-amber-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-3 space-y-2 pt-2 border-t border-amber-200/60">
            {caseDetail.revealedHints.map((h: RevealedHintItem) => (
              <div key={h.level} className="p-2.5 bg-white/80 rounded-lg">
                <span className="font-bold text-amber-800 block text-[11px]">
                  {h.level}단계 힌트
                </span>
                <p className="text-slate-800 mt-0.5">{h.text}</p>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* 2. 새 풀이 사진 등록 (PhotoPicker 활용) */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">
          새로 작성한 손글씨 풀이 등록 <span className="text-red-500">*</span>
        </h2>
        <p className="text-xs text-slate-500">
          이전 풀이의 오류를 고쳐서 다시 푼 손글씨 풀이 사진을 1~3장 등록해 주세요.
        </p>

        <PhotoPicker
          problemPhoto={null} // 재풀이 시에는 기존 문제 사진 유지되므로 문제 사진은 선택받지 않음
          workPhotos={workPhotos}
          onProblemPhotoChange={() => {}}
          onWorkPhotosChange={handleWorkPhotosChange}
        />
      </div>

      {/* 3. 필수 확인 체크박스 */}
      {workPhotos.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2.5 text-xs">
          <h3 className="font-bold text-amber-900">🛡️ 제출 전 필수 확인</h3>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyChecked}
              onChange={(e) => setPrivacyChecked(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 cursor-pointer"
            />
            <span className="text-slate-800 font-medium">
              이름, 학교 등{" "}
              <strong className="text-slate-900">개인정보가 가려져 있음을 확인했습니다.</strong>
            </span>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={legibilityChecked}
              onChange={(e) => setLegibilityChecked(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 cursor-pointer"
            />
            <span className="text-slate-800 font-medium">
              글씨와 수식이 흔들림 없이{" "}
              <strong className="text-slate-900">선명하게 잘 보임을 확인했습니다.</strong>
            </span>
          </label>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <Link
          to="/student/cases/$caseId"
          params={{ caseId: caseDetail.caseId }}
          className="sm:w-auto"
        >
          <Button
            variant="outline"
            className="w-full sm:w-auto h-11 px-5 rounded-xl text-xs font-semibold"
          >
            ← 이전 진단 결과로 돌아가기
          </Button>
        </Link>
        <Button
          type="button"
          onClick={handleSubmitRetry}
          disabled={!canSubmit}
          className={`flex-1 h-11 font-bold text-white rounded-xl ${
            canSubmit
              ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
              : "bg-slate-300 cursor-not-allowed text-slate-500"
          }`}
        >
          {isSubmitting ? "재풀이를 접수하고 있습니다..." : "새 풀이 진단 요청하기 🚀"}
        </Button>
      </div>
    </div>
  );
}
