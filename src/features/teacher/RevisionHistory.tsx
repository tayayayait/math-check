import React from "react";
import { formatSeoulDateTime } from "../../domain/seoul-date";

export interface AuditRecord {
  revision: number;
  changedAt: string;
  teacherId: string;
  action: string;
  comment?: string | undefined;
}

interface RevisionHistoryProps {
  history: AuditRecord[];
}

export function RevisionHistory({ history }: RevisionHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
        아직 기록된 검수 수정 이력이 없습니다. (최초 AI 자동 판정 상태)
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-slate-800">검수 및 수정 감사 이력</h4>
      <div className="space-y-2">
        {history.map((record, index) => (
          <div
            key={index}
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                Rev.{record.revision} · {record.action}
              </span>
              <span className="text-[11px] text-slate-400">
                {formatSeoulDateTime(record.changedAt)}
              </span>
            </div>
            <p className="text-slate-600">
              담당자: <span className="font-medium text-slate-700">{record.teacherId}</span>
            </p>
            {record.comment && (
              <p className="text-slate-700 bg-white p-2 rounded border border-slate-200 mt-1">
                💬 {record.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
