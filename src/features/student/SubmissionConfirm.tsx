import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import type { PhotoDraftItem } from "./PhotoPicker";
import type { ProblemMetadataState } from "./ProblemMetadataForm";

interface SubmissionConfirmProps {
  problemPhoto: PhotoDraftItem;
  workPhotos: PhotoDraftItem[];
  metadata: ProblemMetadataState;
  privacyChecked: boolean;
  legibilityChecked: boolean;
  onPrivacyCheckedChange: (checked: boolean) => void;
  onLegibilityCheckedChange: (checked: boolean) => void;
  onSubmit: () => void;
  onBackToEdit: (step: 1 | 2) => void;
  isSubmitting: boolean;
}

export function SubmissionConfirm({
  problemPhoto,
  workPhotos,
  metadata,
  privacyChecked,
  legibilityChecked,
  onPrivacyCheckedChange,
  onLegibilityCheckedChange,
  onSubmit,
  onBackToEdit,
  isSubmitting,
}: SubmissionConfirmProps) {
  const canSubmit = privacyChecked && legibilityChecked && !isSubmitting;

  return (
    <div className="space-y-6">
      {/* 1. 제출 정보 요약 카드 */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">문제 및 교재 정보</h3>
          <button
            type="button"
            onClick={() => onBackToEdit(2)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            수정하기 ✏️
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-slate-400 block text-[11px]">교재명</span>
            <span className="font-semibold text-slate-900 text-sm truncate block">
              {metadata.bookTitle}
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-slate-400 block text-[11px]">페이지 / 번호</span>
            <span className="font-semibold text-slate-900 text-sm">
              {metadata.page}쪽 #{metadata.problemNo}
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-slate-400 block text-[11px]">단원</span>
            <span className="font-semibold text-slate-900 truncate block">
              {metadata.unitId || "자동 분류"}
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-slate-400 block text-[11px]">등록 사진</span>
            <span className="font-semibold text-slate-900">
              문제 1장 + 풀이 {workPhotos.length}장
            </span>
          </div>
        </div>
      </div>

      {/* 2. 최종 이미지 미리보기 */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">최종 정제 이미지 확인</h3>
          <button
            type="button"
            onClick={() => onBackToEdit(1)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            사진 다시 편집 ✏️
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 문제 사진 */}
          <div className="space-y-1">
            <div className="aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center relative">
              <img
                src={problemPhoto.previewUrl}
                alt="최종 문제 사진"
                className="max-h-full max-w-full object-contain"
              />
              <span className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                문제
              </span>
            </div>
            <p className="text-[11px] text-slate-500 text-center truncate">
              {problemPhoto.width}×{problemPhoto.height}
            </p>
          </div>

          {/* 풀이 사진들 */}
          {workPhotos.map((work, idx) => (
            <div key={work.id} className="space-y-1">
              <div className="aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center relative">
                <img
                  src={work.previewUrl}
                  alt={`최종 풀이 사진 ${idx + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
                <span className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                  풀이 #{idx + 1}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 text-center truncate">
                {work.width}×{work.height}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 필수 확인 체크박스 (2개) */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 sm:p-5 space-y-3">
        <h4 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
          <span>🛡️</span> 제출 전 필수 확인 사항
        </h4>
        <p className="text-xs text-amber-800">
          안전하고 정확한 AI 진단을 위해 아래 항목을 반드시 확인하고 체크해 주세요.
        </p>

        <div className="space-y-2.5 pt-1">
          {/* 개인정보 가림 확인 */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={privacyChecked}
              onChange={(e) => onPrivacyCheckedChange(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 transition-all cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-slate-800 font-medium group-hover:text-slate-900 leading-snug">
              이름, 학교, 학번, 얼굴 등{" "}
              <strong className="text-slate-900">개인정보가 가려져 있음을 확인했습니다.</strong>
              <span className="text-red-500 ml-0.5">*</span>
            </span>
          </label>

          {/* 선명도 확인 */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={legibilityChecked}
              onChange={(e) => onLegibilityCheckedChange(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 transition-all cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-slate-800 font-medium group-hover:text-slate-900 leading-snug">
              글씨와 수식이 흔들림이나 빛 반사 없이{" "}
              <strong className="text-slate-900">선명하게 잘 보임을 확인했습니다.</strong>
              <span className="text-red-500 ml-0.5">*</span>
            </span>
          </label>
        </div>
      </div>

      {/* 제출 액션 버튼 */}
      <div className="pt-2">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className={`w-full h-12 text-base font-bold text-white transition-all rounded-xl ${
            canSubmit
              ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
              : "bg-slate-300 cursor-not-allowed text-slate-500"
          }`}
        >
          {isSubmitting ? "데모 제출을 준비하고 있어요..." : "AI 진단 요청 접수하기 🚀"}
        </Button>
        {!canSubmit && !isSubmitting && (
          <p className="text-[11px] text-slate-400 text-center mt-2">
            * 2가지 필수 확인 사항을 모두 체크해야 제출할 수 있습니다.
          </p>
        )}
      </div>
    </div>
  );
}
