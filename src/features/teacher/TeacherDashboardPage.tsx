import React, { useEffect, useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useAppRepository } from "../../services/data-provider";
import { MetricCard } from "../../components/app/MetricCard";
import { CASE_STATUS_LABELS } from "../../domain/status-labels";
import { formatSeoulDateTime } from "../../domain/seoul-date";
import { isSuccessResponse } from "../../contracts/errors";
import type { TeacherReviewQueueItemDto } from "../../contracts/dto";

export function TeacherDashboardPage() {
  const repo = useAppRepository();

  const [queueItems, setQueueItems] = useState<TeacherReviewQueueItemDto[]>([]);
  const [daysFilter, setDaysFilter] = useState<7 | 30 | 90>(30);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await repo.listReviewQueue();
      if (isSuccessResponse(res)) {
        setQueueItems(res.data.items);
      }
      setIsLoading(false);
    }
    loadData();
  }, [repo]);

  // 기간 필터링
  const itemsInPeriod = useMemo(() => {
    const now = Date.now();
    const maxMs = daysFilter * 24 * 60 * 60 * 1000;
    return queueItems.filter((i) => {
      const t = new Date(i.submittedAt || i.createdAt || Date.now()).getTime();
      return now - t <= maxMs;
    });
  }, [queueItems, daysFilter]);

  // 지표 계산
  const pendingCount = itemsInPeriod.filter((i) => !i.helpRequested).length;
  const helpCount = itemsInPeriod.filter((i) => i.helpRequested).length;
  const retryCount = itemsInPeriod.filter((i) => (i.evaluatedCount ?? 1) > 1).length;
  const repeatedConceptCount = useMemo(() => {
    const concepts = new Set(itemsInPeriod.map((i) => i.conceptId));
    return concepts.size;
  }, [itemsInPeriod]);

  // 우선순위 정렬 업무 큐
  // 0: 도움 요청 / 한도 소진, 1: 불일치, 2: 판독 불가, 3: 재풀이, 4: 기타 -> 동률 submittedAt ASC
  const priorityQueue = useMemo(() => {
    const getPriority = (item: TeacherReviewQueueItemDto) => {
      const count = item.evaluatedCount ?? 1;
      if (item.helpRequested || count >= 4) return 0;
      if (count > 1) return 3;
      return 4;
    };

    return [...itemsInPeriod].sort((a, b) => {
      const pa = getPriority(a);
      const pb = getPriority(b);
      if (pa !== pb) return pa - pb;
      const ta = new Date(a.submittedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.submittedAt || b.createdAt || 0).getTime();
      return ta - tb;
    });
  }, [itemsInPeriod]);

  return (
    <div className="space-y-6">
      {/* 상단 환영 및 기간 선택 바 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-blue-600 font-semibold">선생님 업무 대시보드</span>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            오늘 검토할 학생 진단 및 지도 현황
          </h1>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-400 text-[11px] px-1 font-medium">조회 기간:</span>
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDaysFilter(d)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                daysFilter === d
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              최근 {d}일
            </button>
          ))}
        </div>
      </div>

      {/* 4대 핵심 지표 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/teacher/reviews">
          <MetricCard
            label="교사 확인 대기"
            value={`${pendingCount}건`}
            subValue="원문 검토 필요"
            trend="neutral"
          />
        </Link>
        <Link to="/teacher/reviews">
          <MetricCard
            label="설명 필요 (질문 접수)"
            value={`${helpCount}건`}
            subValue="우선 피드백 대상"
            trend="up"
          />
        </Link>
        <Link to="/teacher/reviews">
          <MetricCard
            label="재풀이 진행 건"
            value={`${retryCount}건`}
            subValue="2회 이상 시도"
            trend="neutral"
          />
        </Link>
        <Link to="/teacher/students">
          <MetricCard
            label="주요 취약 개념"
            value={`${repeatedConceptCount}개`}
            subValue="집중 보완 대상"
            trend="down"
          />
        </Link>
      </div>

      {/* 최우선 처리 업무 큐 목록 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">최우선 지도 및 검수 대상 큐</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              학생 질문 접수 및 다회 오답 건이 우선순위로 상단에 자동 정렬됩니다.
            </p>
          </div>
          <Link
            to="/teacher/reviews"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            전체 대기열 보기 →
          </Link>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            업무 목록을 계산하고 있습니다...
          </div>
        ) : priorityQueue.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {priorityQueue.slice(0, 5).map((item, idx) => (
              <Link
                key={item.caseId}
                to="/teacher/cases/$caseId"
                params={{ caseId: item.caseId }}
                className="block p-4 hover:bg-slate-50/80 transition-colors group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        idx < 2 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {idx + 1}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600">
                          {item.bookTitle ?? "수학 1"} ({item.page ?? 1}쪽 #{item.problemNo ?? "1"})
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded">
                          {item.learnerName}
                        </span>
                        {item.helpRequested && (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full">
                            🙋 학생 질문
                          </span>
                        )}
                        {(item.evaluatedCount ?? 1) >= 4 && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 font-bold rounded-full">
                            ⚠️ 한도 도달
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        접수 일시:{" "}
                        {formatSeoulDateTime(
                          item.submittedAt || item.createdAt || new Date().toISOString(),
                        )}{" "}
                        · 시도 {item.evaluatedCount ?? 1}회
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                    검수하기 →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400">
            현재 처리 대기 중인 긴급 업무가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
