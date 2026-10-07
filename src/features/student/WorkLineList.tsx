import React from "react";
import { MathText } from "../../components/app/MathText";
import type { RecognizedLine, ErrorRegion } from "../../contracts/domain";

interface WorkLineListProps {
  lines: RecognizedLine[];
  errorRegion?: ErrorRegion | null | undefined;
}

export function WorkLineList({ lines, errorRegion }: WorkLineListProps) {
  if (lines.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
        인식된 손글씨 풀이 줄이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
        <span>풀이 단계 번호</span>
        <span>인식된 수식 및 풀이 과정</span>
      </div>

      <div className="space-y-2">
        {lines.map((line) => {
          const isErrorLine = errorRegion && errorRegion.lineId === line.lineId;

          return (
            <div
              key={line.lineId}
              className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                isErrorLine
                  ? "bg-red-50/80 border-red-300 ring-1 ring-red-300 shadow-sm"
                  : "bg-white border-slate-200 hover:bg-slate-50/60"
              }`}
            >
              <span
                className={`text-xs font-bold px-2 py-1 rounded-md shrink-0 ${
                  isErrorLine ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {line.lineId}
              </span>

              <div className="flex-1 text-sm font-medium text-slate-900 overflow-x-auto py-0.5">
                <MathText text={line.text} />
              </div>

              {isErrorLine && (
                <span className="shrink-0 text-xs font-semibold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                  ⚠️ 오류 단계
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
