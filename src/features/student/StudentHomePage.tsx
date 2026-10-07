import React, { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "../../components/ui/button";
import { StatusCard } from "../../components/app/StatusCard";
import { EmptyState } from "../../components/app/EmptyState";
import { useAppRepository } from "../../services/data-provider";
import { useDemoSession } from "../auth/DemoSessionProvider";
import { CASE_STATUS_LABELS, VERDICT_LABELS } from "../../domain/status-labels";
import { formatSeoulDateTime } from "../../domain/seoul-date";
import { isSuccessResponse } from "../../contracts/errors";
import type { StudentCaseListItemDto } from "../../contracts/dto";

export function StudentHomePage() {
  const repo = useAppRepository();
  const { session } = useDemoSession();

  const [inProgressCases, setInProgressCases] = useState<StudentCaseListItemDto[]>([]);
  const [completedCases, setCompletedCases] = useState<StudentCaseListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      setIsLoading(true);
      const res = await repo.listCases({ pageSize: 30 });
      if (isMounted && isSuccessResponse(res)) {
        const allItems: StudentCaseListItemDto[] = res.data.items;

        // 1. 진행 중 카드 필터링 및 우선순위 정렬
        // 우선순위: WAITING_TEACHER (1) -> RETRY_REQUIRED (2) -> PROCESSING (3) -> 기타
        // 동률 시 updatedAt DESC
        const inProgress = allItems.filter(
          (c: StudentCaseListItemDto) =>
            c.caseStatus === "WAITING_TEACHER" ||
            c.caseStatus === "RETRY_REQUIRED" ||
            c.caseStatus === "PROCESSING",
        );

        const getPriority = (status: string) => {
          if (status === "WAITING_TEACHER") return 1;
          if (status === "RETRY_REQUIRED") return 2;
          if (status === "PROCESSING") return 3;
          return 4;
        };

        inProgress.sort((a: StudentCaseListItemDto, b: StudentCaseListItemDto) => {
          const pa = getPriority(a.caseStatus);
          const pb = getPriority(b.caseStatus);
          if (pa !== pb) return pa - pb;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        // 2. 최근 완료 건 필터링 (최대 3개, updatedAt DESC)
        const completed = allItems
          .filter(
            (c: StudentCaseListItemDto) =>
              c.caseStatus === "RESOLVED" || c.caseStatus === "TEACHER_CLOSED",
          )
          .sort(
            (a: StudentCaseListItemDto, b: StudentCaseListItemDto) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          )
          .slice(0, 3);

        setInProgressCases(inProgress);
        setCompletedCases(completed);
        setIsLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [repo]);

  // 활성 분석(PROCESSING) 진행 중 여부 확인
  const activeProcessingCase = inProgressCases.find((c) => c.caseStatus === "PROCESSING");

  // 최대 5개 노출
  const displayedInProgress = inProgressCases.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 학생 인사말 및 상태 요약 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-blue-100 font-medium">수학 손글씨 AI 진단</span>
            <h1 className="text-xl font-bold mt-0.5">
              {session?.name ? `${session.name} 학생, 환영해요!` : "안녕하세요, 학생!"}
            </h1>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg backdrop-blur-sm">
            ✏️
          </div>
        </div>
        <p className="text-xs text-blue-100 mt-2">
          틀린 문제의 손글씨 풀이를 찍어 올리면 AI가 어느 단계에서 오류가 생겼는지 짚어드립니다.
        </p>
      </div>

      {/* 제출 CTA 영역 (활성 분석 중일 시 비활성화 및 안내) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        {activeProcessingCase ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">⏳</span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  현재 AI가 문제를 분석하고 있어요
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  한 번에 1개의 문제만 분석할 수 있습니다. 분석 완료 후 새로 제출할 수 있어요.
                </p>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs flex items-center justify-between">
              <div className="truncate pr-2">
                <span className="font-semibold text-blue-900 block truncate">
                  {activeProcessingCase.bookTitle}
                </span>
                <span className="text-blue-700 text-[11px]">
                  {activeProcessingCase.page}쪽 #{activeProcessingCase.problemNo} · 분석 진행 중
                </span>
              </div>
              <Link
                to="/student/cases/$caseId"
                params={{ caseId: activeProcessingCase.caseId }}
                className="shrink-0"
              >
                <Button
                  size="sm"
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  진행 상태 보기
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">새로운 풀이 진단받기</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                문제와 손글씨 풀이를 등록하고 맞춤 힌트를 확인해 보세요.
              </p>
            </div>
            <Link to="/student/submissions/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm">
                📸 문제 풀이 제출하기 →
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* --- 섹션 1: 진행 중인 문제 카드 --- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">진행 중인 풀이 진단</h2>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
              {inProgressCases.length}건
            </span>
          </div>
          {inProgressCases.length > 5 && (
            <Link
              to="/student/history"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              전체 보기 →
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            진단 목록을 불러오고 있습니다...
          </div>
        ) : displayedInProgress.length > 0 ? (
          <div className="space-y-3">
            {displayedInProgress.map((item) => {
              const statusMeta = CASE_STATUS_LABELS[item.caseStatus];
              return (
                <Link
                  key={item.caseId}
                  to="/student/cases/$caseId"
                  params={{ caseId: item.caseId }}
                  className="block group"
                >
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-400 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate flex-1">
                        <span className="text-[11px] text-slate-400 block">
                          {formatSeoulDateTime(item.updatedAt)} 업데이트
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate mt-0.5">
                          {item.bookTitle} ({item.page}쪽 #{item.problemNo})
                        </h3>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${
                          item.caseStatus === "WAITING_TEACHER"
                            ? "bg-amber-100 text-amber-800"
                            : item.caseStatus === "RETRY_REQUIRED"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {CASE_STATUS_LABELS[item.caseStatus]}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg line-clamp-1">
                      💡 상태: {VERDICT_LABELS[item.verdict]} · {item.evaluatedCount}/
                      {item.maxEvaluatedCount}회 시도
                    </p>
                  </div>
                </Link>
              );
            })}

            {inProgressCases.length > 5 && (
              <div className="text-center pt-1">
                <Link to="/student/history">
                  <Button variant="ghost" className="text-xs text-slate-500 hover:text-slate-900">
                    진행 중인 풀이 {inProgressCases.length}건 전체 보기
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            title="현재 진행 중인 문제가 없습니다"
            description="틀린 문제가 있다면 손글씨 풀이를 찍어 진단을 받아보세요!"
            actionText="풀이 제출하기"
            onAction={() => {}}
          />
        )}
      </div>

      {/* --- 섹션 2: 최근 완료된 문제 --- */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">최근 완료된 문제</h2>
          <Link
            to="/student/history"
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            학습 기록 보기 →
          </Link>
        </div>

        {completedCases.length > 0 ? (
          <div className="space-y-2.5">
            {completedCases.map((item) => (
              <Link
                key={item.caseId}
                to="/student/cases/$caseId"
                params={{ caseId: item.caseId }}
                className="block group"
              >
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between hover:bg-white hover:border-slate-300 transition-all">
                  <div className="truncate pr-3">
                    <h3 className="font-semibold text-xs text-slate-800 group-hover:text-blue-600 truncate">
                      {item.bookTitle} ({item.page}쪽 #{item.problemNo})
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {formatSeoulDateTime(item.updatedAt)} 완료
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full shrink-0">
                    {CASE_STATUS_LABELS[item.caseStatus]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            완료된 학습 이력이 아직 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
