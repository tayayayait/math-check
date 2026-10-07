import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { DEMO_TAXONOMY } from "../../data/demo/taxonomy";

interface LearningSettingsFormProps {
  learnerId: string;
  gradeLevel: number;
  initialUnitId: string;
  initialPrerequisites?: string[];
  initialAllowedUnits?: string[];
  onSave: (settings: {
    gradeLevel: number;
    currentUnitId: string;
    prerequisites: string[];
    allowedUnits: string[];
  }) => Promise<void>;
}

export function LearningSettingsForm({
  learnerId,
  gradeLevel,
  initialUnitId,
  initialPrerequisites = [],
  initialAllowedUnits = [],
  onSave,
}: LearningSettingsFormProps) {
  const [currentUnitId, setCurrentUnitId] = useState(initialUnitId);
  const [prerequisites, setPrerequisites] = useState<string[]>(initialPrerequisites);
  const [newPrereq, setNewPrereq] = useState("");
  const [allowedUnits, setAllowedUnits] = useState<string[]>(
    initialAllowedUnits.length > 0 ? initialAllowedUnits : ["M1_LINEAR_EQUATIONS"],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 선수 개념 추가 (최대 20개)
  const handleAddPrereq = () => {
    if (!newPrereq.trim()) return;
    if (prerequisites.length >= 20) {
      alert("선수 개념은 최대 20개까지 등록할 수 있습니다.");
      return;
    }
    if (prerequisites.includes(newPrereq.trim())) return;
    setPrerequisites([...prerequisites, newPrereq.trim()]);
    setNewPrereq("");
  };

  const handleRemovePrereq = (item: string) => {
    setPrerequisites(prerequisites.filter((p) => p !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      await onSave({
        gradeLevel,
        currentUnitId,
        prerequisites,
        allowedUnits,
      });
      setMessage("학습 설정이 성공적으로 저장되었습니다.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "설정 저장 실패");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5"
    >
      <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">맞춤 학습 및 진단 설정</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            학생에게 허용할 진단 단원 및 집중 보완할 선수 개념을 지정합니다.
          </p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
          중학교 {gradeLevel}학년 (수정 불가)
        </span>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl">
          ✅ {message}
        </div>
      )}

      {/* 현재 주 학습 단원 */}
      <div className="space-y-1.5">
        <label htmlFor="current-unit" className="block text-xs font-bold text-slate-800">
          현재 주 학습 단원
        </label>
        <select
          id="current-unit"
          value={currentUnitId}
          onChange={(e) => setCurrentUnitId(e.target.value)}
          className="w-full h-11 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
        >
          {DEMO_TAXONOMY.map((u) => (
            <option key={u.unitId} value={u.unitId}>
              {u.title}
            </option>
          ))}
        </select>
      </div>

      {/* 선수 개념 목록 (태그, 최대 20개) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-800">
            선수 보완 개념 태그 ({prerequisites.length}/20개)
          </label>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newPrereq}
            onChange={(e) => setNewPrereq(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddPrereq();
              }
            }}
            placeholder="예: 정수와 유리수의 덧셈, 분배법칙 기본"
            className="flex-1 h-9 px-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddPrereq}
            className="h-9 px-3 text-xs shrink-0"
          >
            + 추가
          </Button>
        </div>

        {prerequisites.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {prerequisites.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium"
              >
                {p}
                <button
                  type="button"
                  onClick={() => handleRemovePrereq(p)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 flex justify-end">
        <Button
          type="submit"
          disabled={isSaving}
          className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm"
        >
          {isSaving ? "저장 중..." : "학습 설정 저장하기"}
        </Button>
      </div>
    </form>
  );
}
