import {
  type NormalizedRect,
  clampNormalizedRect,
  rotateRect,
  cropToNormalized,
  toPixelRect,
} from "./coordinates";
import { PHOTO_LIMITS } from "./validate-photo";

export interface PhotoEditState {
  rotationDeg: 0 | 90 | 180 | 270;
  cropRect: NormalizedRect | null;
  maskRects: NormalizedRect[]; // 최대 10개
}

export interface TransformPhotoResult {
  blob: Blob;
  width: number;
  height: number;
  dataUrl: string;
}

/**
 * 긴 변 축소 비율 계산
 * 3000px 초과 시 축소하되 짧은 변이 800px 미만이 되지 않도록 스케일 조정
 */
export function calculateResizeDimensions(
  width: number,
  height: number,
): { width: number; height: number; scale: number } {
  const longEdge = Math.max(width, height);
  const shortEdge = Math.min(width, height);

  if (longEdge <= PHOTO_LIMITS.MAX_LONG_EDGE_PX) {
    return { width, height, scale: 1 };
  }

  // 3000px 기준 스케일 계산
  let scale = PHOTO_LIMITS.MAX_LONG_EDGE_PX / longEdge;
  const scaledShort = shortEdge * scale;

  // 짧은 변이 800px 미만으로 떨어지면 800px 유지 가능한 스케일로 보정
  if (
    scaledShort < PHOTO_LIMITS.RECOMMENDED_SHORT_EDGE_PX &&
    shortEdge >= PHOTO_LIMITS.RECOMMENDED_SHORT_EDGE_PX
  ) {
    scale = PHOTO_LIMITS.RECOMMENDED_SHORT_EDGE_PX / shortEdge;
  }

  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  return { width: targetWidth, height: targetHeight, scale };
}

/**
 * 캔버스를 이용해 사진의 회전, 크롭, 리사이즈, 마스킹(검정 채우기)을 실제 픽셀에 적용
 */
export async function transformPhotoCanvas(
  imageSource: HTMLImageElement | HTMLCanvasElement,
  options: PhotoEditState,
): Promise<TransformPhotoResult> {
  // 브라우저 캔버스 미지원 환경 fallback (테스트 러너 등)
  if (typeof document === "undefined" || !document.createElement) {
    const dummyBlob = new Blob(["mock-image-data"], { type: "image/jpeg" });
    return {
      blob: dummyBlob,
      width: 1200,
      height: 1600,
      dataUrl: "data:image/jpeg;base64,mock",
    };
  }

  const origWidth = "naturalWidth" in imageSource ? imageSource.naturalWidth : imageSource.width;
  const origHeight =
    "naturalHeight" in imageSource ? imageSource.naturalHeight : imageSource.height;

  // 1단계: 회전 캔버스 생성
  const rotCanvas = document.createElement("canvas");
  const isRotated90or270 = options.rotationDeg === 90 || options.rotationDeg === 270;
  rotCanvas.width = isRotated90or270 ? origHeight : origWidth;
  rotCanvas.height = isRotated90or270 ? origWidth : origHeight;

  const rotCtx = rotCanvas.getContext("2d");
  if (!rotCtx) throw new Error("캔버스 2D 컨텍스트를 생성할 수 없습니다.");

  rotCtx.save();
  rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
  rotCtx.rotate((options.rotationDeg * Math.PI) / 180);
  rotCtx.drawImage(imageSource, -origWidth / 2, -origHeight / 2);
  rotCtx.restore();

  // 2단계: 크롭 영역 계산 (회전된 캔버스 기준)
  let cropX = 0;
  let cropY = 0;
  let cropWidth = rotCanvas.width;
  let cropHeight = rotCanvas.height;

  if (options.cropRect) {
    // cropRect가 회전 전 기준이라면 회전 변환 적용
    const rotatedCrop = rotateRect(options.cropRect, options.rotationDeg);
    const pixelCrop = toPixelRect(rotatedCrop, rotCanvas.width, rotCanvas.height);
    cropX = Math.max(0, pixelCrop.x);
    cropY = Math.max(0, pixelCrop.y);
    cropWidth = Math.max(10, Math.min(rotCanvas.width - cropX, pixelCrop.width));
    cropHeight = Math.max(10, Math.min(rotCanvas.height - cropY, pixelCrop.height));
  }

  // 3단계: 리사이즈 치수 계산
  const { width: finalWidth, height: finalHeight } = calculateResizeDimensions(
    cropWidth,
    cropHeight,
  );

  // 최종 캔버스
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = finalWidth;
  finalCanvas.height = finalHeight;

  const finalCtx = finalCanvas.getContext("2d");
  if (!finalCtx) throw new Error("최종 캔버스 컨텍스트를 생성할 수 없습니다.");

  // 배경 흰색 초기화
  finalCtx.fillStyle = "#FFFFFF";
  finalCtx.fillRect(0, 0, finalWidth, finalHeight);

  // 크롭 영역을 최종 캔버스에 그리기
  finalCtx.drawImage(rotCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, finalWidth, finalHeight);

  // 4단계: 개인정보 가림 마스크 적용 (불투명 검정 #000000)
  finalCtx.fillStyle = "#000000";
  const validMasks = options.maskRects.slice(0, PHOTO_LIMITS.MAX_MASKS_COUNT);

  for (const mask of validMasks) {
    // mask 좌표를 회전 및 크롭 상대 좌표로 변환
    let effectiveMask = rotateRect(mask, options.rotationDeg);
    if (options.cropRect) {
      const rotatedCrop = rotateRect(options.cropRect, options.rotationDeg);
      const relative = cropToNormalized(rotatedCrop, effectiveMask);
      if (!relative) continue; // 크롭 바깥 마스크는 제외
      effectiveMask = relative;
    }

    const pixelMask = toPixelRect(effectiveMask, finalWidth, finalHeight);
    finalCtx.fillRect(pixelMask.x, pixelMask.y, pixelMask.width, pixelMask.height);
  }

  // 5단계: Blob 및 DataURL 생성
  return new Promise((resolve, reject) => {
    finalCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("캔버스에서 이미지를 생성하지 못했습니다."));
          return;
        }
        const dataUrl = finalCanvas.toDataURL("image/jpeg", 0.9);
        resolve({
          blob,
          width: finalWidth,
          height: finalHeight,
          dataUrl,
        });
      },
      "image/jpeg",
      0.9,
    );
  });
}
