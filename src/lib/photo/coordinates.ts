/**
 * 정규화 좌표(0~1) 관리 및 회전/크롭/마스킹 기하 변환 유틸리티
 */

export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const EPSILON = 0.0001;

/**
 * 정규화 좌표 유효성 검증
 * - x, y >= 0
 * - width, height > 0
 * - x + width <= 1, y + height <= 1
 */
export function isValidNormalizedRect(rect: NormalizedRect): boolean {
  if (rect.x < -EPSILON || rect.y < -EPSILON) return false;
  if (rect.width <= 0 || rect.height <= 0) return false;
  if (rect.x + rect.width > 1 + EPSILON) return false;
  if (rect.y + rect.height > 1 + EPSILON) return false;
  return true;
}

/**
 * 정규화 좌표 범위 제한(0~1 클램핑)
 */
export function clampNormalizedRect(rect: NormalizedRect): NormalizedRect {
  const x = Math.max(0, Math.min(1, rect.x));
  const y = Math.max(0, Math.min(1, rect.y));
  const width = Math.max(0, Math.min(1 - x, rect.width));
  const height = Math.max(0, Math.min(1 - y, rect.height));

  return {
    x: Number(x.toFixed(4)),
    y: Number(y.toFixed(4)),
    width: Number(width.toFixed(4)),
    height: Number(height.toFixed(4)),
  };
}

/**
 * 시계 방향 90도 단위 회전에 따른 정규화 사각형 좌표 변환
 * @param rect 원본 기준 정규화 좌표
 * @param rotationDeg 0, 90, 180, 270
 */
export function rotateRect(rect: NormalizedRect, rotationDeg: 0 | 90 | 180 | 270): NormalizedRect {
  const norm = clampNormalizedRect(rect);
  if (rotationDeg === 0) return norm;

  if (rotationDeg === 90) {
    return clampNormalizedRect({
      x: 1 - (norm.y + norm.height),
      y: norm.x,
      width: norm.height,
      height: norm.width,
    });
  }

  if (rotationDeg === 180) {
    return clampNormalizedRect({
      x: 1 - (norm.x + norm.width),
      y: 1 - (norm.y + norm.height),
      width: norm.width,
      height: norm.height,
    });
  }

  if (rotationDeg === 270) {
    return clampNormalizedRect({
      x: norm.y,
      y: 1 - (norm.x + norm.width),
      width: norm.height,
      height: norm.width,
    });
  }

  return norm;
}

/**
 * 크롭 영역(crop) 기준으로 대상 사각형(target)의 상대 정규화 좌표 변환
 * 크롭 영역 밖에 있으면 교차 영역만 계산하거나 겹치지 않으면 null 반환
 */
export function cropToNormalized(
  crop: NormalizedRect,
  target: NormalizedRect,
): NormalizedRect | null {
  // 교차 사각형 계산
  const interX1 = Math.max(crop.x, target.x);
  const interY1 = Math.max(crop.y, target.y);
  const interX2 = Math.min(crop.x + crop.width, target.x + target.width);
  const interY2 = Math.min(crop.y + crop.height, target.y + target.height);

  if (interX2 <= interX1 || interY2 <= interY1) {
    return null; // 교차하지 않음
  }

  const relX = (interX1 - crop.x) / crop.width;
  const relY = (interY1 - crop.y) / crop.height;
  const relW = (interX2 - interX1) / crop.width;
  const relH = (interY2 - interY1) / crop.height;

  return clampNormalizedRect({
    x: relX,
    y: relY,
    width: relW,
    height: relH,
  });
}

/**
 * 정규화 좌표를 픽셀 좌표로 변환
 */
export function toPixelRect(
  rect: NormalizedRect,
  imageWidth: number,
  imageHeight: number,
): PixelRect {
  const norm = clampNormalizedRect(rect);
  return {
    x: Math.round(norm.x * imageWidth),
    y: Math.round(norm.y * imageHeight),
    width: Math.round(norm.width * imageWidth),
    height: Math.round(norm.height * imageHeight),
  };
}

/**
 * 픽셀 좌표를 정규화 좌표(0~1)로 변환
 */
export function toNormalizedRect(
  pixel: PixelRect,
  imageWidth: number,
  imageHeight: number,
): NormalizedRect {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  return clampNormalizedRect({
    x: pixel.x / imageWidth,
    y: pixel.y / imageHeight,
    width: pixel.width / imageWidth,
    height: pixel.height / imageHeight,
  });
}
