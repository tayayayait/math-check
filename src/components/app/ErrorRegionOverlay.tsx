import React from "react";
import type { ErrorRegion } from "../../contracts/domain";

interface ErrorRegionOverlayProps {
  errorRegion: ErrorRegion | null | undefined;
  lineLabel?: string | undefined;
}

export function ErrorRegionOverlay({ errorRegion, lineLabel }: ErrorRegionOverlayProps) {
  if (!errorRegion || !errorRegion.bbox) {
    return null;
  }

  const { x, y, w, h } = errorRegion.bbox;

  return (
    <div
      aria-label={`오류 발생 영역: ${errorRegion.lineId}`}
      className="absolute border-2 border-red-500 bg-red-500/20 rounded pointer-events-none transition-all duration-200"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${w * 100}%`,
        height: `${h * 100}%`,
      }}
    >
      <span className="absolute -top-6 left-0 bg-red-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded shadow">
        ⚠️ 오류 단계 ({lineLabel || errorRegion.lineId})
      </span>
    </div>
  );
}
