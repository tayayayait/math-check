import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { MathText } from "../../components/app/MathText";
import type { RevealedHintItem } from "../../contracts/domain";

interface HintPanelProps {
  revealedHints: RevealedHintItem[];
  canRevealNextHint: boolean;
  helpRequested: boolean;
  onRevealHint: (level: number) => Promise<void>;
}

export function HintPanel({
  revealedHints,
  canRevealNextHint,
  helpRequested,
  onRevealHint,
}: HintPanelProps) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 현재 공개된 단계 수
  const currentLevel = revealedHints.length;
  const nextLevel = currentLevel + 1;

  const handleReveal = async () => {
    if (isRevealing || !canRevealNextHint || helpRequested || nextLevel > 3) return;
    setIsRevealing(true);
    setErrorMessage(null);

    try {
      await onRevealHint(nextLevel);
      // 2초 쿨다운 적용
      setTimeout(() => {
        setIsRevealing(false);
      }, 2000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "힌트 열람 중 오류가 발생했습니다.");
      setIsRevealing(false);
    }
  };

  const getHintLevelBadge = (level: number) => {
    switch (level) {
      case 1:
        return "1단계: 개념 및 방향 힌트";
      case 2:
        return "2단계: 오류 교정 힌트";
      case 3:
        return "3단계: 계산 및 풀이 힌트";
      default:
        return `${level}단계 힌트`;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">💡</span>
          <div>
            <h3 className="text-base font-bold text-slate-900">단계별 맞춤 힌트</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              스스로 정답을 찾을 수 있도록 점진적으로 힌트를 제공합니다.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">
          {currentLevel} / 3단계 열람
        </span>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* 이미 공개된 힌트 목록 */}
      {revealedHints.length > 0 ? (
        <div className="space-y-3">
          {revealedHints.map((hint) => (
            <div
              key={hint.level}
              className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800">
                  {getHintLevelBadge(hint.level)}
                </span>
                <span className="text-[10px] text-amber-600 font-medium">열람 완료</span>
              </div>
              <div className="text-sm text-slate-800 font-medium leading-relaxed pl-0.5">
                <MathText text={hint.text} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
          아직 열람한 힌트가 없습니다. 풀이가 막힌다면 1단계 힌트를 확인해 보세요!
        </div>
      )}

      {/* 다음 힌트 열기 액션 버튼 */}
      {helpRequested ? (
        <div className="p-3 bg-blue-50 border border-blue-200 text-xs text-blue-800 rounded-xl text-center">
          ℹ️ 선생님께 질문이 접수되어 확인 대기 중입니다. 추가 힌트는 잠시 보류됩니다.
        </div>
      ) : nextLevel <= 3 && canRevealNextHint ? (
        <div className="pt-1">
          <Button
            type="button"
            onClick={handleReveal}
            disabled={isRevealing}
            className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm transition-all shadow-sm"
          >
            {isRevealing
              ? "힌트를 불러오고 있습니다..."
              : `🔍 ${nextLevel}단계 힌트 열기 (${getHintLevelBadge(nextLevel)})`}
          </Button>
          <p className="text-[11px] text-slate-400 text-center mt-1.5">
            * 힌트를 차근차근 읽어보고 식을 다시 세워보세요.
          </p>
        </div>
      ) : currentLevel >= 3 ? (
        <div className="p-3 bg-slate-50 border border-slate-200 text-xs text-slate-600 rounded-xl text-center">
          ✅ 모든 단계의 힌트를 확인했습니다. 이제 스스로 다시 풀어서 제출해 보세요!
        </div>
      ) : null}
    </div>
  );
}
