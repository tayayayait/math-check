import React from "react";
import type { BoundingBox, PhotoRef } from "../../contracts/domain";

export interface WorkImageProps {
  photoRef: PhotoRef;
  src?: string | undefined;
  alt: string;
  errorBbox?: BoundingBox | null | undefined;
  className?: string;
}

export function WorkImage({ photoRef, src, alt, errorBbox, className = "" }: WorkImageProps) {
  // src가 없으면 합성 placeholder svg 사용
  const imageSrc =
    src ||
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${photoRef.width}" height="${photoRef.height}" viewBox="0 0 ${photoRef.width} ${photoRef.height}"><rect width="100%" height="100%" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%2364748b">${encodeURIComponent(alt)}</text></svg>`;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-muted ${className}`}
    >
      <img
        src={imageSrc}
        alt={alt}
        width={photoRef.width}
        height={photoRef.height}
        className="h-auto w-full object-contain"
        loading="lazy"
      />

      {errorBbox && (
        <div
          role="region"
          aria-label="오류 감지 영역"
          style={{
            position: "absolute",
            left: `${errorBbox.x * 100}%`,
            top: `${errorBbox.y * 100}%`,
            width: `${errorBbox.w * 100}%`,
            height: `${errorBbox.h * 100}%`,
          }}
          className="border-2 border-dashed border-error bg-error/10 pointer-events-none rounded animate-pulse"
        />
      )}
    </div>
  );
}
