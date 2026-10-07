/**
 * 교사용 복습 문제 8대 검수 체크리스트 컴포넌트
 * features/review/ReviewChecklist.tsx
 */

import React from "react";
import { Checkbox } from "../../components/ui/checkbox";
import { CHECKLIST_DESCRIPTIONS, type ReviewItemChecklist } from "../../contracts/review-item";

interface ReviewChecklistProps {
  checklist: ReviewItemChecklist;
  onChange?: (key: keyof ReviewItemChecklist, checked: boolean) => void;
  readOnly?: boolean;
}

export function ReviewChecklist({ checklist, onChange, readOnly = false }: ReviewChecklistProps) {
  const keys = Object.keys(CHECKLIST_DESCRIPTIONS) as Array<keyof ReviewItemChecklist>;
  const passedCount = keys.filter((k) => checklist[k]).length;
  const allPassed = passedCount === keys.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">복습 문항 8대 품질·적합성 검수 기준</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            학생에게 안전하고 교육적으로 유의미한 복습을 제공하기 위해 8개 항목을 모두 통과해야
            승인할 수 있습니다.
          </p>
        </div>

        <div className="text-right">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold ${
              allPassed
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            {passedCount} / {keys.length} 검수 통과
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {keys.map((key) => {
          const info = CHECKLIST_DESCRIPTIONS[key];
          const isChecked = checklist[key];

          return (
            <label
              key={key}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                isChecked
                  ? "bg-blue-50/40 border-blue-200"
                  : "bg-slate-50 border-slate-200 opacity-80"
              } ${readOnly ? "cursor-default" : "hover:border-blue-400"}`}
            >
              <Checkbox
                checked={isChecked}
                disabled={readOnly}
                onCheckedChange={(val) => {
                  if (!readOnly && onChange) {
                    onChange(key, Boolean(val));
                  }
                }}
                className="mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <div className="space-y-0.5 text-xs">
                <span
                  className={`font-bold block ${isChecked ? "text-slate-900" : "text-slate-500"}`}
                >
                  {info.title}
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">{info.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
