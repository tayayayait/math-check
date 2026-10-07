import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "../../components/ui/button";
import { ErrorRegionOverlay } from "../../components/app/ErrorRegionOverlay";
import { WorkLineList } from "./WorkLineList";
import { HintPanel } from "./HintPanel";
import { AttemptTimeline } from "./AttemptTimeline";
import { HelpRequestDialog } from "./HelpRequestDialog";
import { CASE_STATUS_LABELS, VERDICT_LABELS } from "../../domain/status-labels";
import type { StudentCaseDto } from "../../contracts/dto";

interface CaseResultProps {
  caseDetail: StudentCaseDto;
  onRevealHint: (level: number) => Promise<void>;
  onRequestHelp: (message: string) => Promise<void>;
}

export function CaseResult({ caseDetail, onRevealHint, onRequestHelp }: CaseResultProps) {
  const [selectedPhotoTab, setSelectedPhotoTab] = useState<"PROBLEM" | "WORK">("WORK");
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

  const isCorrect = caseDetail.verdict === "CORRECT";
  const isIncorrect = caseDetail.verdict === "INCORRECT";
  const isUnreadable = caseDetail.verdict === "UNREADABLE";

  // 기본 헤더 안내 문구
  const getVerdictHeader = () => {
    if (isCorrect) {
      return {
        title: "풀이가 맞아요! 🎉",
        desc: "풀이 과정과 최종 정답이 모두 정확합니다.",
        colorClass: "from-emerald-600 to-teal-600",
      };
    }
    if (isIncorrect) {
      return {
        title: "답에 이르기 전 풀이를 다시 살펴봐요 🧐",
        desc:
          caseDetail.studentMessage || "중간 계산 또는 개념 적용 단계에서 오류가 발견되었습니다.",
        colorClass: "from-blue-600 to-indigo-600",
      };
    }
    if (isUnreadable) {
      return {
        title: "손글씨 판독이 어렵습니다 📷",
        desc: "글씨가 흐리거나 일부 가려져 있습니다. 선명하게 다시 촬영해 주세요.",
        colorClass: "from-amber-600 to-orange-600",
      };
    }
    return {
      title: "선생님 확인 대기 중 👨‍🏫",
      desc: "담당 선생님께서 풀이를 직접 검토하신 후 안내해 드립니다.",
      colorClass: "from-slate-700 to-slate-900",
    };
  };

  const headerMeta = getVerdictHeader();

  // 첫 번째 풀이 사진 URL (기본값)
  const workPhotoUrl = caseDetail.workPhotoRefs[0]
    ? `/demo/sample-work.svg` // 데모 fallback URL
    : "";
  const problemPhotoUrl = `/demo/sample-problem.svg`;

  return (
    <div className="space-y-6">
      {/* 1. 상단 판정 헤더 배너 */}
      <div
        className={`bg-gradient-to-r ${headerMeta.colorClass} rounded-2xl p-5 text-white shadow-md`}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-semibold backdrop-blur-sm">
              {CASE_STATUS_LABELS[caseDetail.caseStatus]} · {VERDICT_LABELS[caseDetail.verdict]}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{headerMeta.title}</h1>
          </div>
          <div className="text-3xl">
            {isCorrect ? "✅" : isIncorrect ? "💡" : isUnreadable ? "🔍" : "⏳"}
          </div>
        </div>
        <p className="text-xs sm:text-sm text-white/90 mt-2 font-normal leading-relaxed">
          {headerMeta.desc}
        </p>
      </div>

      {/* 2. 교재 메타 요약 바 */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">교재 및 문제</span>
          <span className="font-bold text-slate-800 text-sm">
            {caseDetail.bookTitle} ({caseDetail.page}쪽 #{caseDetail.problemNo})
          </span>
        </div>
        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg">
          {caseDetail.unitId}
        </span>
      </div>

      {/* 3. 사진 아코디언 / 탭 (오류 오버레이 포함) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">제출 사진 확인</span>
          <div className="flex gap-1">
            <Button
              type="button"
              variant={selectedPhotoTab === "WORK" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPhotoTab("WORK")}
              className="h-8 text-xs px-3"
            >
              내 손글씨 풀이 ({caseDetail.workPhotoRefs.length}장)
            </Button>
            <Button
              type="button"
              variant={selectedPhotoTab === "PROBLEM" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPhotoTab("PROBLEM")}
              className="h-8 text-xs px-3"
            >
              교재 문제
            </Button>
          </div>
        </div>

        <div className="p-4 bg-slate-900 flex items-center justify-center min-h-[260px] max-h-[460px] relative overflow-hidden">
          {selectedPhotoTab === "WORK" ? (
            <div className="relative max-h-full max-w-full flex items-center justify-center">
              <img
                src={workPhotoUrl}
                alt="학생 손글씨 풀이 원문"
                className="max-h-[420px] max-w-full object-contain rounded"
              />
              {/* 오류 발생 바운딩 박스 오버레이 */}
              <ErrorRegionOverlay errorRegion={caseDetail.errorRegion} />
            </div>
          ) : (
            <div className="relative max-h-full max-w-full flex items-center justify-center">
              <img
                src={problemPhotoUrl}
                alt="교재 문제 사진"
                className="max-h-[420px] max-w-full object-contain rounded"
              />
            </div>
          )}
        </div>
      </div>

      {/* 4. 확인된 인식 풀이 목록 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900">인식된 단계별 풀이 과정</h3>
        <WorkLineList lines={caseDetail.recognizedLines} errorRegion={caseDetail.errorRegion} />
      </div>

      {/* 5. 맞춤 힌트 패널 (오답일 때) */}
      {isIncorrect && (
        <HintPanel
          revealedHints={caseDetail.revealedHints}
          canRevealNextHint={caseDetail.canRevealNextHint}
          helpRequested={caseDetail.helpRequested}
          onRevealHint={onRevealHint}
        />
      )}

      {/* 6. 액션 버튼 (재풀이 / 선생님께 질문) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {caseDetail.canResubmit && (
            <Link
              to="/student/cases/$caseId/retry"
              params={{ caseId: caseDetail.caseId }}
              className="flex-1"
            >
              <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 text-sm">
                ✏️ 다시 풀어서 제출하기
              </Button>
            </Link>
          )}

          {caseDetail.canAskTeacher && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsHelpDialogOpen(true)}
              className="h-12 px-5 font-semibold text-slate-700 border-slate-300 hover:bg-slate-50 rounded-xl text-sm"
            >
              🙋 선생님께 질문하기
            </Button>
          )}
        </div>

        {caseDetail.helpRequested && (
          <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-center">
            선생님께 질문이 접수되었습니다. 확인 후 안내해 주실 예정입니다.
          </p>
        )}
      </div>

      {/* 7. 시도 타임라인 이력 */}
      <AttemptTimeline caseDetail={caseDetail} />

      {/* 질문 모달 */}
      <HelpRequestDialog
        isOpen={isHelpDialogOpen}
        onClose={() => setIsHelpDialogOpen(false)}
        onSubmit={onRequestHelp}
      />
    </div>
  );
}
