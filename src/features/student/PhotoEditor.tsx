import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { type NormalizedRect, clampNormalizedRect } from "../../lib/photo/coordinates";
import { PHOTO_LIMITS } from "../../lib/photo/validate-photo";
import { type PhotoEditState, transformPhotoCanvas } from "../../lib/photo/transform-photo";

interface PhotoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  initialEditState?: PhotoEditState | undefined;
  onSave: (result: {
    blob: Blob;
    width: number;
    height: number;
    dataUrl: string;
    editState: PhotoEditState;
  }) => void;
}

export function PhotoEditor({
  isOpen,
  onClose,
  imageUrl,
  initialEditState,
  onSave,
}: PhotoEditorProps) {
  // 회전 상태 (0, 90, 180, 270도)
  const [rotationDeg, setRotationDeg] = useState<0 | 90 | 180 | 270>(
    initialEditState?.rotationDeg ?? 0,
  );

  // 크롭 사각형 (0~1)
  const [cropRect, setCropRect] = useState<NormalizedRect | null>(
    initialEditState?.cropRect ?? null,
  );

  // 마스크 목록 (최대 10개)
  const [masks, setMasks] = useState<NormalizedRect[]>(
    initialEditState?.maskRects ? [...initialEditState.maskRects] : [],
  );

  // 현재 선택된 마스크 인덱스
  const [selectedMaskIndex, setSelectedMaskIndex] = useState<number | null>(null);

  // 편집 모드: 'crop' | 'mask'
  const [activeMode, setActiveMode] = useState<"crop" | "mask">("crop");

  // 저장 중 로딩
  const [isProcessing, setIsProcessing] = useState(false);

  // 이미지 엘리먼트 참조
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // 모달 열릴 때 초기 상태 복원
  useEffect(() => {
    if (isOpen) {
      setRotationDeg(initialEditState?.rotationDeg ?? 0);
      setCropRect(initialEditState?.cropRect ?? null);
      setMasks(initialEditState?.maskRects ? [...initialEditState.maskRects] : []);
      setSelectedMaskIndex(null);
      setActiveMode("crop");
      setImageLoaded(false);
    }
  }, [isOpen, initialEditState]);

  // 시계방향 90도 회전
  const handleRotate = () => {
    setRotationDeg((prev) => {
      const next = ((prev + 90) % 360) as 0 | 90 | 180 | 270;
      return next;
    });
  };

  // 초기화
  const handleReset = () => {
    setRotationDeg(0);
    setCropRect(null);
    setMasks([]);
    setSelectedMaskIndex(null);
  };

  // 새 마스크 추가
  const handleAddMask = () => {
    if (masks.length >= PHOTO_LIMITS.MAX_MASKS_COUNT) {
      alert(`마스크는 최대 ${PHOTO_LIMITS.MAX_MASKS_COUNT}개까지 추가할 수 있습니다.`);
      return;
    }
    // 중앙에 기본 20% 크기의 마스크 추가
    const newMask: NormalizedRect = {
      x: 0.4,
      y: 0.4,
      width: 0.2,
      height: 0.1,
    };
    setMasks((prev) => [...prev, newMask]);
    setSelectedMaskIndex(masks.length);
    setActiveMode("mask");
  };

  // 선택된 마스크 삭제
  const handleDeleteSelectedMask = () => {
    if (selectedMaskIndex === null) return;
    setMasks((prev) => prev.filter((_, i) => i !== selectedMaskIndex));
    setSelectedMaskIndex(null);
  };

  // 저장 처리
  const handleSave = async () => {
    if (!imgRef.current) return;
    setIsProcessing(true);
    try {
      const editState: PhotoEditState = {
        rotationDeg,
        cropRect,
        maskRects: masks,
      };

      const result = await transformPhotoCanvas(imgRef.current, editState);
      onSave({
        ...result,
        editState,
      });
      onClose();
    } catch (err) {
      alert(
        "사진 편집 처리 중 오류가 발생했습니다: " +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // 키보드로 크롭 또는 마스크 미세 조정 (화살표 1%, Shift+화살표 5%)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    let dx = 0;
    let dy = 0;

    if (e.key === "ArrowLeft") dx = -step;
    else if (e.key === "ArrowRight") dx = step;
    else if (e.key === "ArrowUp") dy = -step;
    else if (e.key === "ArrowDown") dy = step;
    else return;

    e.preventDefault();

    if (activeMode === "mask" && selectedMaskIndex !== null && masks[selectedMaskIndex]) {
      const current = masks[selectedMaskIndex]!;
      const updated = clampNormalizedRect({
        ...current,
        x: current.x + dx,
        y: current.y + dy,
      });
      setMasks((prev) => prev.map((m, i) => (i === selectedMaskIndex ? updated : m)));
    } else if (activeMode === "crop") {
      const current = cropRect ?? { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
      const updated = clampNormalizedRect({
        ...current,
        x: current.x + dx,
        y: current.y + dy,
      });
      setCropRect(updated);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[760px] w-full max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden focus:outline-none"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="pb-2 border-b border-slate-200">
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center justify-between">
            <span>사진 정제 및 개인정보 가림 편집</span>
            <span className="text-xs font-normal text-slate-500">
              방향키(1%), Shift+방향키(5%) 이동 지원
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* 툴바 컨트롤 */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="h-9 px-3 gap-1.5"
            >
              🔄 90° 회전 ({rotationDeg}°)
            </Button>
            <Button
              type="button"
              variant={activeMode === "crop" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setActiveMode("crop");
                if (!cropRect) {
                  setCropRect({ x: 0.05, y: 0.05, width: 0.9, height: 0.9 });
                }
              }}
              className="h-9 px-3"
            >
              ✂️ 자르기(Crop)
            </Button>
            <Button
              type="button"
              variant={activeMode === "mask" ? "default" : "outline"}
              size="sm"
              onClick={handleAddMask}
              disabled={masks.length >= PHOTO_LIMITS.MAX_MASKS_COUNT}
              className="h-9 px-3 gap-1"
            >
              ⬛ 이름/개인정보 가림 (+{masks.length}/{PHOTO_LIMITS.MAX_MASKS_COUNT})
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {activeMode === "mask" && selectedMaskIndex !== null && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelectedMask}
                className="h-9 px-2 text-xs"
              >
                선택 마스크 삭제
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-9 text-slate-600 hover:text-slate-900 text-xs"
            >
              전체 초기화
            </Button>
          </div>
        </div>

        {/* 미리보기 및 캔버스 오버레이 영역 */}
        <div className="relative flex-1 min-h-[300px] max-h-[50vh] bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center p-2 select-none">
          <img
            ref={imgRef}
            src={imageUrl}
            alt="편집 대상 사진"
            className="max-h-full max-w-full object-contain transition-transform duration-150"
            style={{ transform: `rotate(${rotationDeg}deg)` }}
            onLoad={() => setImageLoaded(true)}
          />

          {/* 오버레이 컨트롤 (이미지가 로드되었을 때만 표시) */}
          {imageLoaded && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-full h-full max-w-full max-h-full">
                {/* 크롭 가이드 표시 */}
                {cropRect && (
                  <div
                    className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10 pointer-events-auto cursor-move"
                    style={{
                      left: `${cropRect.x * 100}%`,
                      top: `${cropRect.y * 100}%`,
                      width: `${cropRect.width * 100}%`,
                      height: `${cropRect.height * 100}%`,
                    }}
                    onClick={() => setActiveMode("crop")}
                  >
                    <span className="absolute -top-6 left-0 bg-blue-600 text-white text-[11px] font-medium px-1.5 py-0.5 rounded">
                      자르기 영역 ({Math.round(cropRect.width * 100)}% ×{" "}
                      {Math.round(cropRect.height * 100)}%)
                    </span>
                  </div>
                )}

                {/* 마스크(검정 가림) 오버레이 표시 */}
                {masks.map((mask, idx) => {
                  const isSelected = selectedMaskIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`absolute bg-black pointer-events-auto cursor-pointer transition-all ${
                        isSelected
                          ? "ring-2 ring-amber-400 ring-offset-1"
                          : "opacity-90 hover:opacity-100"
                      }`}
                      style={{
                        left: `${mask.x * 100}%`,
                        top: `${mask.y * 100}%`,
                        width: `${mask.width * 100}%`,
                        height: `${mask.height * 100}%`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMaskIndex(idx);
                        setActiveMode("mask");
                      }}
                    >
                      <span className="absolute top-0 right-0 bg-slate-800/80 text-white text-[10px] px-1 rounded-bl">
                        #{idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 세부 좌표 수치 조정 폼 (접근성 및 정밀 조정) */}
        <div className="py-2 px-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-4">
          {activeMode === "crop" && cropRect && (
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-900">자르기 크기 조절:</span>
              <div className="flex items-center gap-1.5">
                <Label htmlFor="crop-w" className="text-[11px]">
                  가로(%)
                </Label>
                <Input
                  id="crop-w"
                  type="number"
                  min="10"
                  max="100"
                  value={Math.round(cropRect.width * 100)}
                  onChange={(e) => {
                    const val = Math.max(10, Math.min(100, Number(e.target.value))) / 100;
                    setCropRect(clampNormalizedRect({ ...cropRect, width: val }));
                  }}
                  className="w-16 h-7 text-xs px-1"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Label htmlFor="crop-h" className="text-[11px]">
                  세로(%)
                </Label>
                <Input
                  id="crop-h"
                  type="number"
                  min="10"
                  max="100"
                  value={Math.round(cropRect.height * 100)}
                  onChange={(e) => {
                    const val = Math.max(10, Math.min(100, Number(e.target.value))) / 100;
                    setCropRect(clampNormalizedRect({ ...cropRect, height: val }));
                  }}
                  className="w-16 h-7 text-xs px-1"
                />
              </div>
            </div>
          )}

          {activeMode === "mask" && selectedMaskIndex !== null && masks[selectedMaskIndex] && (
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-900">
                선택된 마스크 #{selectedMaskIndex + 1}:
              </span>
              <div className="flex items-center gap-1.5">
                <Label htmlFor="mask-w" className="text-[11px]">
                  가로(%)
                </Label>
                <Input
                  id="mask-w"
                  type="number"
                  min="5"
                  max="100"
                  value={Math.round(masks[selectedMaskIndex]!.width * 100)}
                  onChange={(e) => {
                    const val = Math.max(5, Math.min(100, Number(e.target.value))) / 100;
                    const updated = clampNormalizedRect({
                      ...masks[selectedMaskIndex]!,
                      width: val,
                    });
                    setMasks((prev) => prev.map((m, i) => (i === selectedMaskIndex ? updated : m)));
                  }}
                  className="w-16 h-7 text-xs px-1"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Label htmlFor="mask-h" className="text-[11px]">
                  세로(%)
                </Label>
                <Input
                  id="mask-h"
                  type="number"
                  min="3"
                  max="100"
                  value={Math.round(masks[selectedMaskIndex]!.height * 100)}
                  onChange={(e) => {
                    const val = Math.max(3, Math.min(100, Number(e.target.value))) / 100;
                    const updated = clampNormalizedRect({
                      ...masks[selectedMaskIndex]!,
                      height: val,
                    });
                    setMasks((prev) => prev.map((m, i) => (i === selectedMaskIndex ? updated : m)));
                  }}
                  className="w-16 h-7 text-xs px-1"
                />
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-500">
            * 저장 시 캔버스에서 회전·자르기·불투명 검정 마스크가 픽셀에 직접 구워집니다.
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-slate-200 flex sm:justify-between items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="h-10 px-4 min-w-[80px]"
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isProcessing}
            className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isProcessing ? "처리 중..." : "편집 완료 및 적용"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
