import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useAppRepository } from "../../services/data-provider";
import { LearningSettingsForm } from "./LearningSettingsForm";
import { AppErrorState } from "../../components/app/AppErrorState";
import { CASE_STATUS_LABELS, VERDICT_LABELS } from "../../domain/status-labels";
import { formatSeoulDateTime } from "../../domain/seoul-date";
import { isSuccessResponse } from "../../contracts/errors";
import type { TeacherLearnerDto, StudentCaseListItemDto } from "../../contracts/dto";

export function StudentDetailPage() {
  const { learnerId } = useParams({ strict: false }) as { learnerId: string };
  const repo = useAppRepository();

  const [learner, setLearner] = useState<TeacherLearnerDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadLearner = useCallback(async () => {
    if (!learnerId) return;
    setIsLoading(true);
    const res = await repo.getLearner(learnerId);
    if (isSuccessResponse(res)) {
      setLearner(res.data);
      setErrorMessage(null);
    } else {
      setErrorMessage(res.error.message || "해당 학생 정보를 불러올 수 없습니다.");
    }
    setIsLoading(false);
  }, [repo, learnerId]);

  useEffect(() => {
    loadLearner();
  }, [loadLearner]);

  const handleSaveSettings = async (settings: {
    gradeLevel: number;
    currentUnitId: string;
    prerequisites: string[];
    allowedUnits: string[];
  }) => {
    if (!learner) return;
    const res = await repo.updateLearningSettings({
      learnerId: learner.learnerId,
      expectedVersion: learner.settingsVersion ?? 1,
      currentUnitId: settings.currentUnitId,
      prerequisites: settings.prerequisites,
      allowedUnits: settings.allowedUnits,
    });
    if (isSuccessResponse(res)) {
      await loadLearner();
    } else {
      throw new Error(res.error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        학생 상세 정보를 불러오고 있습니다...
      </div>
    );
  }

  if (errorMessage || !learner) {
    return (
      <AppErrorState
        status={404}
        title="학생 정보를 찾을 수 없습니다"
        description={errorMessage || "담당 학생이 아니거나 존재하지 않는 계정입니다."}
        actionText="학생 목록으로 돌아가기"
        actionHref="/teacher/students"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 학생 상단 프로필 헤더 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-blue-100 text-blue-700 font-bold text-lg rounded-full flex items-center justify-center">
            {learner.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{learner.name} 학생</h1>
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded">
                중{learner.gradeLevel}
              </span>
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                {learner.loginId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              총 {learner.recentCases?.length ?? learner.totalSubmissions}건 제출 이력
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/teacher/students">
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-2 rounded-xl"
            >
              ← 학생 목록으로
            </button>
          </Link>
        </div>
      </div>

      {/* 반복 취약 개념 분석 카드 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">반복 오답 및 집중 지도 필요 개념</h3>
          <span className="text-xs font-semibold px-2 py-0.5 bg-red-50 text-red-700 rounded-full">
            {learner.repeatedConcepts.length}개 취약 개념
          </span>
        </div>

        {learner.repeatedConcepts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {learner.repeatedConcepts.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-red-50/60 border border-red-200 rounded-xl space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-900">
                    {item.conceptId} ({item.count}회)
                  </span>
                  <span className="text-[10px] bg-red-200/80 text-red-800 px-1.5 py-0.5 rounded font-semibold">
                    집중 보완
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  최근 풀이에서 동일한 개념의 오답이 반복 검출되었습니다.
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl">
            현재 14일간 반복 검출된 취약 개념이 없습니다. (양호)
          </p>
        )}
      </div>

      {/* 문제 제출 및 진단 이력 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          문제 제출 및 진단 이력 ({learner.recentCases?.length ?? 0}건)
        </h3>

        {(learner.recentCases?.length ?? 0) > 0 ? (
          <div className="space-y-2.5">
            {learner.recentCases?.map((c: StudentCaseListItemDto) => (
              <Link
                key={c.caseId}
                to="/teacher/cases/$caseId"
                params={{ caseId: c.caseId }}
                className="block group"
              >
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-blue-50/50 hover:border-blue-300 transition-all text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-600 truncate">
                      {c.bookTitle} ({c.page}쪽 #{c.problemNo})
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {formatSeoulDateTime(c.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">
                      {VERDICT_LABELS[c.verdict as keyof typeof VERDICT_LABELS] ?? c.verdict}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[11px]">
                      {CASE_STATUS_LABELS[c.caseStatus as keyof typeof CASE_STATUS_LABELS] ??
                        c.caseStatus}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl">
            제출된 진단 이력이 없습니다.
          </p>
        )}
      </div>

      {/* 학습 설정 관리 폼 */}
      <LearningSettingsForm
        learnerId={learner.learnerId}
        gradeLevel={learner.gradeLevel}
        initialUnitId={learner.currentUnitId ?? "M1_LINEAR_EQUATIONS"}
        initialPrerequisites={learner.prerequisites ?? []}
        initialAllowedUnits={learner.allowedUnits ?? []}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
