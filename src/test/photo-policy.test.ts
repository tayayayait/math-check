import { describe, it, expect } from "vitest";
import {
  isValidNormalizedRect,
  clampNormalizedRect,
  rotateRect,
  cropToNormalized,
  toPixelRect,
  toNormalizedRect,
  type NormalizedRect,
} from "../lib/photo/coordinates";
import { PHOTO_LIMITS, validatePhotoFile, validateTotalPhotos } from "../lib/photo/validate-photo";
import { calculateResizeDimensions } from "../lib/photo/transform-photo";

describe("Photo Policy & Geometry Transformations", () => {
  describe("Coordinates & Geometry", () => {
    it("정규화 사각형 유효성을 올바르게 판정해야 한다", () => {
      expect(isValidNormalizedRect({ x: 0, y: 0, width: 1, height: 1 })).toBe(true);
      expect(isValidNormalizedRect({ x: 0.1, y: 0.2, width: 0.5, height: 0.5 })).toBe(true);

      // 음수 좌표 차단
      expect(isValidNormalizedRect({ x: -0.1, y: 0, width: 0.5, height: 0.5 })).toBe(false);
      // 크기 0 차단
      expect(isValidNormalizedRect({ x: 0, y: 0, width: 0, height: 0.5 })).toBe(false);
      // 범위 초과(x + w > 1) 차단
      expect(isValidNormalizedRect({ x: 0.8, y: 0.1, width: 0.3, height: 0.5 })).toBe(false);
      // 범위 초과(y + h > 1) 차단
      expect(isValidNormalizedRect({ x: 0.1, y: 0.8, width: 0.5, height: 0.3 })).toBe(false);
    });

    it("정규화 사각형 범위를 0~1 사이로 안전하게 클램핑해야 한다", () => {
      const clamped = clampNormalizedRect({ x: -0.2, y: 0.5, width: 0.8, height: 0.8 });
      expect(clamped.x).toBe(0);
      expect(clamped.y).toBe(0.5);
      expect(clamped.height).toBe(0.5); // 1 - y
    });

    it("시계 방향 90도 회전 시 좌표를 올바르게 변환해야 한다", () => {
      // (0.1, 0.2, 0.3, 0.4)
      // 90도 회전: x' = 1 - (y + h) = 1 - 0.6 = 0.4, y' = x = 0.1, w' = 0.4, h' = 0.3
      const rect: NormalizedRect = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 };
      const rot90 = rotateRect(rect, 90);
      expect(rot90.x).toBeCloseTo(0.4, 3);
      expect(rot90.y).toBeCloseTo(0.1, 3);
      expect(rot90.width).toBeCloseTo(0.4, 3);
      expect(rot90.height).toBeCloseTo(0.3, 3);

      // 180도 회전: x' = 1 - (x + w) = 1 - 0.4 = 0.6, y' = 1 - (y + h) = 0.4
      const rot180 = rotateRect(rect, 180);
      expect(rot180.x).toBeCloseTo(0.6, 3);
      expect(rot180.y).toBeCloseTo(0.4, 3);
      expect(rot180.width).toBeCloseTo(0.3, 3);
      expect(rot180.height).toBeCloseTo(0.4, 3);

      // 360도(0도) 동일성
      const rot0 = rotateRect(rect, 0);
      expect(rot0).toEqual(rect);
    });

    it("크롭 사각형 내 상대 정규화 좌표를 올바르게 계산해야 한다", () => {
      const crop: NormalizedRect = { x: 0.2, y: 0.2, width: 0.6, height: 0.6 };
      const targetInside: NormalizedRect = { x: 0.3, y: 0.3, width: 0.3, height: 0.3 };

      const rel = cropToNormalized(crop, targetInside);
      expect(rel).not.toBeNull();
      // x: (0.3 - 0.2) / 0.6 = 0.1 / 0.6 = 0.1667
      expect(rel!.x).toBeCloseTo(0.1667, 3);
      expect(rel!.width).toBeCloseTo(0.5, 3);

      // 크롭 밖 완전히 벗어난 대상
      const targetOutside: NormalizedRect = { x: 0.0, y: 0.0, width: 0.1, height: 0.1 };
      expect(cropToNormalized(crop, targetOutside)).toBeNull();
    });

    it("픽셀 좌표와 정규화 좌표 간의 변환이 정확해야 한다", () => {
      const norm: NormalizedRect = { x: 0.25, y: 0.5, width: 0.5, height: 0.25 };
      const pixel = toPixelRect(norm, 1000, 800);
      expect(pixel).toEqual({ x: 250, y: 400, width: 500, height: 200 });

      const backNorm = toNormalizedRect(pixel, 1000, 800);
      expect(backNorm).toEqual(norm);
    });
  });

  describe("Validation Policies", () => {
    it("12MiB 초과 파일은 거절해야 한다", async () => {
      // 12MiB + 1byte
      const oversizedFile = new File([new ArrayBuffer(12 * 1024 * 1024 + 1)], "big.jpg", {
        type: "image/jpeg",
      });
      const res = await validatePhotoFile(oversizedFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("12MiB를 초과");
    });

    it("지원하지 않는 포맷(예: gif, txt)은 거절해야 한다", async () => {
      const gifFile = new File([new ArrayBuffer(100)], "test.gif", { type: "image/gif" });
      const res = await validatePhotoFile(gifFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("지원하지 않는 이미지 형식");
    });

    it("전체 사진 합계가 32MiB를 초과하면 거절해야 한다", () => {
      const f1 = new File([new ArrayBuffer(10 * 1024 * 1024)], "1.jpg", { type: "image/jpeg" });
      const f2 = new File([new ArrayBuffer(11 * 1024 * 1024)], "2.jpg", { type: "image/jpeg" });
      const f3 = new File([new ArrayBuffer(12 * 1024 * 1024)], "3.jpg", { type: "image/jpeg" });
      // 합계 33MiB > 32MiB
      const res = validateTotalPhotos([f1, f2, f3]);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("32MiB를 초과");
    });

    it("사진 장수가 0장이거나 4장을 초과하면 거절해야 한다", () => {
      expect(validateTotalPhotos([]).valid).toBe(false);

      const dummy = new File([new ArrayBuffer(100)], "p.jpg", { type: "image/jpeg" });
      expect(validateTotalPhotos([dummy, dummy, dummy, dummy]).valid).toBe(true);
      expect(validateTotalPhotos([dummy, dummy, dummy, dummy, dummy]).valid).toBe(false);
    });
  });

  describe("Resize Calculations", () => {
    it("긴 변이 3000px 이하인 이미지는 크기를 유지해야 한다", () => {
      const res = calculateResizeDimensions(1920, 1080);
      expect(res.width).toBe(1920);
      expect(res.height).toBe(1080);
      expect(res.scale).toBe(1);
    });

    it("긴 변이 4000px인 고해상도 이미지는 비율을 유지하며 축소해야 한다", () => {
      const res = calculateResizeDimensions(4000, 2000);
      expect(res.width).toBe(3000);
      expect(res.height).toBe(1500);
      expect(res.scale).toBe(0.75);
    });
  });
});
