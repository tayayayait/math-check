/**
 * 복습 문제 후보 확인 및 교사 수정 폼 컴포넌트
 * features/review/ReviewCandidateForm.tsx
 */

import React, { useState } from "react";
import { MathText } from "../../components/app/MathText";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { validateReviewCandidateLimits } from "../../domain/review-policy";

interface ReviewCandidateFormProps {
  initialProblemText: string;
  initialDifficulty: "BASIC" | "STANDARD";
  expectedAnswer?: string | undefined;
  independentVerification?: string | undefined;
  questionVersion: number;
  readOnly?: boolean;
  onSave?: (updated: { problemText: string; difficulty: "BASIC" | "STANDARD" }) => Promise<void>;
}

export function ReviewCandidateForm({
  initialProblemText,
  initialDifficulty,
  expectedAnswer,
  independentVerification,
  questionVersion,
  readOnly = false,
  onSave,
}: ReviewCandidateFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [problemText, setProblemText] = useState(initialProblemText);
  const [difficulty, setDifficulty] = useState<"BASIC" | "STANDARD">(initialDifficulty);
  const [isSaving, setIsSaving] = useState(false);

  const limits = validateReviewCandidateLimits(problemText);
  const mathMatches = problemText.match(/\$[^$]+\$/g) || [];

  const handleSave = async () => {
    if (!limits.valid || !onSave) return;
    setIsSaving(true);
    try {
      await onSave({ problemText, difficulty });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900">복습 문항 내용 (v{questionVersion})</h3>
          <span
            className={`text-xs px-2 py-0.5 rounded font-semibold ${
              difficulty === "BASIC" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
            }`}
          >
            {difficulty === "BASIC" ? "기초 (BASIC)" : "표준 (STANDARD)"}
          </span>
        </div>

        {!readOnly && !isEditing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-xs h-8"
          >
            문항 직접 수정
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <label htmlFor="problem-text-input" className="font-semibold text-slate-700">
                문제 본문 편집 (LaTeX 수식은 $로 감싸기)
              </label>
              <span>
                {problemText.length} / 800자 (수식: {mathMatches.length} / 10개)
              </span>
            </div>
            <Textarea
              id="problem-text-input"
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              className="font-mono text-sm min-h-[110px]"
              maxLength={800}
            />
            {!limits.valid && <p className="text-xs text-red-600 font-semibold">{limits.reason}</p>}
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="font-semibold text-slate-700">난이도 설정:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="difficulty"
                value="BASIC"
                checked={difficulty === "BASIC"}
                onChange={() => setDifficulty("BASIC")}
                className="text-blue-600"
              />
              <span>기초 (BASIC: 괄호 1개 이하)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="difficulty"
                value="STANDARD"
                checked={difficulty === "STANDARD"}
                onChange={() => setDifficulty("STANDARD")}
                className="text-blue-600"
              />
              <span>표준 (STANDARD: 괄호 및 복합 전개)</span>
            </label>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800">
            ⚠️ 문항 본문을 수정하면 문항 버전(questionVersion)이 증가하며, 기존 승인이 취소되고
            재검증 상태로 전환됩니다.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setProblemText(initialProblemText);
                setDifficulty(initialDifficulty);
                setIsEditing(false);
              }}
              disabled={isSaving}
              className="text-xs"
            >
              취소
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!limits.valid || isSaving}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? "저장 중..." : "수정 내용 반영 (v" + (questionVersion + 1) + ")"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 수식 렌더링 미리보기 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              실제 학생 화면 렌더링 미리보기 (MathText)
            </span>
            <div className="text-base text-slate-900 font-medium py-1">
              <MathText text={problemText} />
            </div>
          </div>

          {/* 비공개 기준 정답 및 독립 검증 (교사 전용) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
            {expectedAnswer && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-700 block">비공개 기준 정답</span>
                <p className="font-mono text-blue-700">{expectedAnswer}</p>
                <p className="text-[11px] text-slate-400">
                  학생 및 보호자 화면에는 노출되지 않습니다.
                </p>
              </div>
            )}

            {independentVerification && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-700 block">합성 독립 검증 풀이 과정</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {independentVerification}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
