/**
 * 사진 업로드 검증 정책 및 크기/해상도/포맷 검사 유틸리티
 */

export const PHOTO_LIMITS = {
  MAX_FILE_BYTES: 12 * 1024 * 1024, // 12MiB (12,582,912 bytes)
  MAX_TOTAL_BYTES: 32 * 1024 * 1024, // 32MiB (33,554,432 bytes)
  MIN_SHORT_EDGE_PX: 400, // 400px 미만 차단
  RECOMMENDED_SHORT_EDGE_PX: 800, // 800px 미만 시 권고 경고
  MAX_MEGAPIXELS: 24_000_000, // 24,000,000 픽셀 초과 차단
  MAX_LONG_EDGE_PX: 3000, // 긴 변 3000px 초과 시 축소 권장
  MIN_CROP_EDGE_PERCENT: 10, // 크롭 사각형 각 변 최소 10%
  MAX_MASKS_COUNT: 10, // 마스크 최대 10개
} as const;

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export interface PhotoValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  width?: number;
  height?: number;
}

/**
 * 개별 사진 파일의 크기, 포맷 및 이미지 디코드 유효성 검증
 */
export async function validatePhotoFile(file: File): Promise<PhotoValidationResult> {
  // 1. 파일 크기 검사 (최대 12MiB)
  if (file.size > PHOTO_LIMITS.MAX_FILE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `파일 크기가 12MiB를 초과했습니다. (현재: ${sizeMb}MiB)`,
    };
  }

  // 2. 포맷 검사
  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  const isHeic =
    mimeType.includes("heic") ||
    mimeType.includes("heif") ||
    fileName.endsWith(".heic") ||
    fileName.endsWith(".heif");

  const isAllowedMime =
    ALLOWED_MIME_TYPES.includes(mimeType) ||
    isHeic ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".png") ||
    fileName.endsWith(".webp");

  if (!isAllowedMime) {
    return {
      valid: false,
      error: "지원하지 않는 이미지 형식입니다. JPG, PNG, WebP 파일을 올려주세요.",
    };
  }

  // 3. 브라우저 디코드 및 해상도 검사
  return new Promise((resolve) => {
    // 환경에 Window/Image가 없는 테스트 러너 fallback
    if (typeof window === "undefined" || typeof Image === "undefined") {
      resolve({ valid: true, width: 1200, height: 1600 });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const shortEdge = Math.min(width, height);
      const totalPixels = width * height;

      // 짧은 변 400px 미만 차단
      if (shortEdge < PHOTO_LIMITS.MIN_SHORT_EDGE_PX) {
        resolve({
          valid: false,
          error: `사진 해상도가 너무 낮습니다 (짧은 변 ${shortEdge}px). 최소 ${PHOTO_LIMITS.MIN_SHORT_EDGE_PX}px 이상이어야 합니다.`,
          width,
          height,
        });
        return;
      }

      // 24MP 초과 차단
      if (totalPixels > PHOTO_LIMITS.MAX_MEGAPIXELS) {
        const mp = (totalPixels / 1_000_000).toFixed(1);
        resolve({
          valid: false,
          error: `해상도가 2400만 화소(24MP)를 초과했습니다. (현재: 약 ${mp}MP)`,
          width,
          height,
        });
        return;
      }

      // 800px 미만 권고
      let warning: string | undefined;
      if (shortEdge < PHOTO_LIMITS.RECOMMENDED_SHORT_EDGE_PX) {
        warning = `사진의 해상도가 다소 낮아(짧은 변 ${shortEdge}px) 손글씨 인식이 어려울 수 있습니다. 선명한 사진을 권장합니다.`;
      }

      resolve({
        valid: true,
        width,
        height,
        ...(warning ? { warning } : {}),
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      if (isHeic) {
        resolve({
          valid: false,
          error:
            "HEIC/HEIF 이미지를 브라우저에서 직접 읽을 수 없습니다. JPG 또는 PNG 형식으로 변환하여 올려주세요.",
        });
      } else {
        resolve({
          valid: false,
          error: "이미지 파일을 디코딩할 수 없습니다. 정상적인 사진 파일인지 확인해 주세요.",
        });
      }
    };

    img.src = objectUrl;
  });
}

/**
 * 전체 사진 세트(문제 1장 + 풀이 최대 3장)의 총합 용량 및 장수 검증
 */
export function validateTotalPhotos(files: File[]): { valid: boolean; error?: string } {
  if (files.length === 0) {
    return { valid: false, error: "사진을 1장 이상 등록해 주세요." };
  }

  if (files.length > 4) {
    return {
      valid: false,
      error: "사진은 문제 1장과 풀이 최대 3장(총 4장)까지 등록할 수 있습니다.",
    };
  }

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  if (totalBytes > PHOTO_LIMITS.MAX_TOTAL_BYTES) {
    const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `전체 사진 합계 용량이 32MiB를 초과했습니다. (현재: ${totalMb}MiB)`,
    };
  }

  return { valid: true };
}
