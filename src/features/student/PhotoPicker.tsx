import React, { useState, useRef, useEffect } from "react";
import { Button } from "../../components/ui/button";
import {
  validatePhotoFile,
  validateTotalPhotos,
  PHOTO_LIMITS,
} from "../../lib/photo/validate-photo";
import { PhotoEditor } from "./PhotoEditor";
import type { PhotoEditState } from "../../lib/photo/transform-photo";

export interface PhotoDraftItem {
  id: string;
  purpose: "PROBLEM" | "WORK";
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  bytes: number;
  mime: string;
  warning?: string | undefined;
  editState?: PhotoEditState | undefined;
  editedBlob?: Blob | undefined;
  editedRevision: number;
}

interface PhotoPickerProps {
  problemPhoto: PhotoDraftItem | null;
  workPhotos: PhotoDraftItem[];
  onProblemPhotoChange: (photo: PhotoDraftItem | null) => void;
  onWorkPhotosChange: (photos: PhotoDraftItem[]) => void;
}

export function PhotoPicker({
  problemPhoto,
  workPhotos,
  onProblemPhotoChange,
  onWorkPhotosChange,
}: PhotoPickerProps) {
  // 숨겨진 input 엘리먼트 참조
  const problemFileInputRef = useRef<HTMLInputElement | null>(null);
  const problemCameraInputRef = useRef<HTMLInputElement | null>(null);
  const workFileInputRef = useRef<HTMLInputElement | null>(null);
  const workCameraInputRef = useRef<HTMLInputElement | null>(null);

  // 현재 편집 중인 사진 대상
  const [editingTarget, setEditingTarget] = useState<{
    item: PhotoDraftItem;
    isProblem: boolean;
    workIndex?: number;
  } | null>(null);

  // 오류 메시지 상태
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 총 용량 계산
  const totalBytes =
    (problemPhoto?.bytes ?? 0) + workPhotos.reduce((acc, cur) => acc + cur.bytes, 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
  const totalPercent = Math.min(100, (totalBytes / PHOTO_LIMITS.MAX_TOTAL_BYTES) * 100);

  // 파일 추가 핸들러
  const handleFileSelected = async (files: FileList | null, purpose: "PROBLEM" | "WORK") => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);

    const file = files[0];
    if (!file) return;

    // 단일 파일 유효성 검증
    const validation = await validatePhotoFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || "올바른 사진 파일이 아닙니다.");
      return;
    }

    // 총합 검증
    const currentFiles = [
      ...(problemPhoto && purpose !== "PROBLEM" ? [problemPhoto.file] : []),
      ...workPhotos.map((w) => w.file),
      file,
    ];
    const totalValidation = validateTotalPhotos(currentFiles);
    if (!totalValidation.valid && totalValidation.error) {
      setErrorMessage(totalValidation.error);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const newItem: PhotoDraftItem = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      purpose,
      file,
      previewUrl,
      width: validation.width || 1200,
      height: validation.height || 1600,
      bytes: file.size,
      mime: file.type || "image/jpeg",
      warning: validation.warning,
      editedRevision: 1,
    };

    if (purpose === "PROBLEM") {
      if (problemPhoto?.previewUrl) {
        URL.revokeObjectURL(problemPhoto.previewUrl);
      }
      onProblemPhotoChange(newItem);
    } else {
      if (workPhotos.length >= 3) {
        setErrorMessage("풀이 사진은 최대 3장까지 등록할 수 있습니다.");
        URL.revokeObjectURL(previewUrl);
        return;
      }
      onWorkPhotosChange([...workPhotos, newItem]);
    }
  };

  // 데모 샘플 사진 불러오기
  const handleLoadSample = async (purpose: "PROBLEM" | "WORK") => {
    setErrorMessage(null);
    try {
      const url = purpose === "PROBLEM" ? "/demo/sample-problem.svg" : "/demo/sample-work.svg";
      const filename =
        purpose === "PROBLEM" ? "sample-problem.png" : `sample-work-${workPhotos.length + 1}.png`;

      const resp = await fetch(url);
      const blob = await resp.blob();
      const file = new File([blob], filename, { type: "image/png" });

      const validation = await validatePhotoFile(file);
      const previewUrl = URL.createObjectURL(file);

      const newItem: PhotoDraftItem = {
        id: `demo_${purpose.toLowerCase()}_${Date.now()}`,
        purpose,
        file,
        previewUrl,
        width: validation.width || 800,
        height: validation.height || (purpose === "PROBLEM" ? 600 : 1000),
        bytes: file.size,
        mime: "image/png",
        warning: validation.warning,
        editedRevision: 1,
      };

      if (purpose === "PROBLEM") {
        if (problemPhoto?.previewUrl) URL.revokeObjectURL(problemPhoto.previewUrl);
        onProblemPhotoChange(newItem);
      } else {
        if (workPhotos.length >= 3) {
          setErrorMessage("풀이 사진은 최대 3장까지 등록할 수 있습니다.");
          URL.revokeObjectURL(previewUrl);
          return;
        }
        onWorkPhotosChange([...workPhotos, newItem]);
      }
    } catch {
      setErrorMessage("샘플 이미지를 불러오는 중 문제가 발생했습니다.");
    }
  };

  // 풀이 사진 순서 위로 이동
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...workPhotos];
    const temp = next[index - 1]!;
    next[index - 1] = next[index]!;
    next[index] = temp;
    onWorkPhotosChange(next);
  };

  // 풀이 사진 순서 아래로 이동
  const handleMoveDown = (index: number) => {
    if (index >= workPhotos.length - 1) return;
    const next = [...workPhotos];
    const temp = next[index + 1]!;
    next[index + 1] = next[index]!;
    next[index] = temp;
    onWorkPhotosChange(next);
  };

  // 풀이 사진 삭제
  const handleDeleteWorkPhoto = (index: number) => {
    const target = workPhotos[index];
    if (target?.previewUrl) {
      URL.revokeObjectURL(target.previewUrl);
    }
    onWorkPhotosChange(workPhotos.filter((_, i) => i !== index));
  };

  // 문제 사진 삭제
  const handleDeleteProblemPhoto = () => {
    if (problemPhoto?.previewUrl) {
      URL.revokeObjectURL(problemPhoto.previewUrl);
    }
    onProblemPhotoChange(null);
  };

  // 편집 저장 완료 핸들러
  const handleEditorSave = (result: {
    blob: Blob;
    width: number;
    height: number;
    dataUrl: string;
    editState: PhotoEditState;
  }) => {
    if (!editingTarget) return;

    const { item, isProblem, workIndex } = editingTarget;
    // 기존 URL 정리
    URL.revokeObjectURL(item.previewUrl);
    const newPreviewUrl = URL.createObjectURL(result.blob);

    const updatedItem: PhotoDraftItem = {
      ...item,
      previewUrl: newPreviewUrl,
      width: result.width,
      height: result.height,
      bytes: result.blob.size,
      editedBlob: result.blob,
      editState: result.editState,
      editedRevision: item.editedRevision + 1,
    };

    if (isProblem) {
      onProblemPhotoChange(updatedItem);
    } else if (workIndex !== undefined) {
      const next = [...workPhotos];
      next[workIndex] = updatedItem;
      onWorkPhotosChange(next);
    }

    setEditingTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* 오류 메시지 배너 */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between"
        >
          <span>⚠️ {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2 text-base"
          >
            ×
          </button>
        </div>
      )}

      {/* 용량 상태 바 */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
        <div className="flex justify-between items-center text-slate-700 font-medium">
          <span>사진 총 용량 ({totalMb}MiB / 최대 32MiB)</span>
          <span>{totalPercent.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              totalPercent > 90 ? "bg-red-500" : "bg-blue-600"
            }`}
            style={{ width: `${totalPercent}%` }}
          />
        </div>
        <p className="text-slate-500 text-[11px]">
          * 문제 1장 필수, 풀이 1~3장 필수입니다. (최대 총 4장)
        </p>
      </div>

      {/* --- 섹션 1: 문제 사진 (1장 필수) --- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              1. 문제 사진 <span className="text-red-500">*</span>
            </h3>
            <span className="text-xs text-slate-500">(교재 문제 영역 1장)</span>
          </div>
          {!problemPhoto && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleLoadSample("PROBLEM")}
              className="text-xs h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              샘플 문제 불러오기
            </Button>
          )}
        </div>

        {problemPhoto ? (
          <div className="relative border border-slate-200 rounded-xl p-3 bg-white shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative w-full sm:w-36 h-36 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center shrink-0">
              <img
                src={problemPhoto.previewUrl}
                alt="문제 사진 미리보기"
                className="max-h-full max-w-full object-contain"
              />
              <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                문제
              </span>
            </div>

            <div className="flex-1 space-y-1.5 text-xs text-slate-600 w-full">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm">
                  {problemPhoto.file.name}
                </span>
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-medium rounded text-[11px]">
                  Rev.{problemPhoto.editedRevision}
                </span>
              </div>
              <p>
                해상도: {problemPhoto.width} × {problemPhoto.height} px · 용량:{" "}
                {(problemPhoto.bytes / (1024 * 1024)).toFixed(2)} MiB
              </p>
              {problemPhoto.warning && (
                <p className="text-amber-600 font-medium">⚠️ {problemPhoto.warning}</p>
              )}
              {problemPhoto.editState && (
                <p className="text-slate-500 text-[11px]">
                  편집 적용: 회전 {problemPhoto.editState.rotationDeg}° · 마스크{" "}
                  {problemPhoto.editState.maskRects.length}개
                </p>
              )}

              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setEditingTarget({
                      item: problemPhoto,
                      isProblem: true,
                    })
                  }
                  className="h-8 text-xs font-medium text-slate-700"
                >
                  ✏️ 회전/자르기/가림 편집
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteProblemPhoto}
                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  삭제
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <div className="text-slate-400 mb-2 text-2xl">📸</div>
            <p className="text-sm font-medium text-slate-700 mb-1">문제 사진을 등록해 주세요</p>
            <p className="text-xs text-slate-500 mb-4">
              JPG, PNG, WebP 지원 (최대 12MiB, 선명도 800px 이상 권장)
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => problemFileInputRef.current?.click()}
                className="h-9 px-4 text-xs font-medium"
              >
                📁 사진 보관함에서 선택
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => problemCameraInputRef.current?.click()}
                className="h-9 px-4 text-xs font-medium"
              >
                📷 카메라로 직접 촬영
              </Button>
            </div>
            {/* 파일 선택 인풋 */}
            <input
              ref={problemFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="hidden"
              onChange={(e) => handleFileSelected(e.target.files, "PROBLEM")}
            />
            {/* 카메라 촬영 인풋 */}
            <input
              ref={problemCameraInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileSelected(e.target.files, "PROBLEM")}
            />
          </div>
        )}
      </div>

      {/* --- 섹션 2: 풀이 사진 (1~3장 필수) --- */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              2. 풀이 사진 <span className="text-red-500">*</span>
            </h3>
            <span className="text-xs text-slate-500">(손글씨 풀이 과정 1~3장 등록)</span>
          </div>
          {workPhotos.length < 3 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleLoadSample("WORK")}
              className="text-xs h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              샘플 풀이 불러오기 ({workPhotos.length + 1}/3)
            </Button>
          )}
        </div>

        {/* 풀이 사진 카드 목록 */}
        <div className="space-y-3">
          {workPhotos.map((work, index) => (
            <div
              key={work.id}
              className="relative border border-slate-200 rounded-xl p-3 bg-white shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center"
            >
              <div className="relative w-full sm:w-36 h-36 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center shrink-0">
                <img
                  src={work.previewUrl}
                  alt={`풀이 사진 ${index + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                  풀이 #{index + 1}
                </span>
              </div>

              <div className="flex-1 space-y-1.5 text-xs text-slate-600 w-full">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-sm">{work.file.name}</span>
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-medium rounded text-[11px]">
                    Rev.{work.editedRevision}
                  </span>
                </div>
                <p>
                  해상도: {work.width} × {work.height} px · 용량:{" "}
                  {(work.bytes / (1024 * 1024)).toFixed(2)} MiB
                </p>
                {work.warning && <p className="text-amber-600 font-medium">⚠️ {work.warning}</p>}
                {work.editState && (
                  <p className="text-slate-500 text-[11px]">
                    편집 적용: 회전 {work.editState.rotationDeg}° · 마스크{" "}
                    {work.editState.maskRects.length}개
                  </p>
                )}

                <div className="pt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditingTarget({
                        item: work,
                        isProblem: false,
                        workIndex: index,
                      })
                    }
                    className="h-8 text-xs font-medium text-slate-700"
                  >
                    ✏️ 회전/자르기/가림 편집
                  </Button>

                  {/* 순서 이동 버튼 */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => handleMoveUp(index)}
                    className="h-8 px-2 text-xs"
                    title="위로 이동"
                  >
                    ↑ 위로
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={index === workPhotos.length - 1}
                    onClick={() => handleMoveDown(index)}
                    className="h-8 px-2 text-xs"
                    title="아래로 이동"
                  >
                    ↓ 아래로
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWorkPhoto(index)}
                    className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                  >
                    삭제
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* 풀이 사진 추가 버튼 영역 (최대 3장 미만일 때 노출) */}
          {workPhotos.length < 3 && (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <p className="text-xs font-medium text-slate-700 mb-2">
                풀이 사진 추가 ({workPhotos.length}/3장 등록됨)
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => workFileInputRef.current?.click()}
                  className="h-8 px-3 text-xs"
                >
                  📁 사진 추가
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => workCameraInputRef.current?.click()}
                  className="h-8 px-3 text-xs"
                >
                  📷 촬영 추가
                </Button>
              </div>

              <input
                ref={workFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="hidden"
                onChange={(e) => handleFileSelected(e.target.files, "WORK")}
              />
              <input
                ref={workCameraInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileSelected(e.target.files, "WORK")}
              />
            </div>
          )}
        </div>
      </div>

      {/* 사진 편집 모달 */}
      {editingTarget && (
        <PhotoEditor
          isOpen={true}
          onClose={() => setEditingTarget(null)}
          imageUrl={editingTarget.item.previewUrl}
          initialEditState={editingTarget.item.editState}
          onSave={handleEditorSave}
        />
      )}
    </div>
  );
}
