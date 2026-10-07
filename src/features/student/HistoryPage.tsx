import React, { useEffect, useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/app/EmptyState";
import { useAppRepository } from "../../services/data-provider";
import { CASE_STATUS_LABELS, VERDICT_LABELS } from "../../domain/status-labels";
import { formatSeoulDateTime } from "../../domain/seoul-date";
import { isSuccessResponse } from "../../contracts/errors";
import type { StudentCaseListItemDto } from "../../contracts/dto";
import type { CaseStatus, CaseKind } from "../../contracts/domain";

export function HistoryPage() {
  const repo = useAppRepository();

  const [items, setItems] = useState<StudentCaseListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [kindFilter, setKindFilter] = useState<string>("ALL");
  const [daysFilter, setDaysFilter] = useState<number>(30); // 기본 30일, 최대 90일

  // 검색어 IME 300ms 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 데이터 로드
  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      setIsLoading(true);
      const res = await repo.listCases({ pageSize: 50 });
      if (isMounted && isSuccessResponse(res)) {
        setItems(res.data.items);
      }
      if (isMounted) setIsLoading(false);
    }
    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [repo]);

  // 클라이언트 필터링 (기간, 상태, 유형, 검색어)
  const filteredItems = useMemo(() => {
    const now = new Date().getTime();
    const maxDaysMs = daysFilter * 24 * 60 * 60 * 1000;

    return items.filter((item) => {
      // 1. 기간 검사 (서울 기준 날짜 차이)
      const itemTime = new Date(item.createdAt).getTime();
      if (now - itemTime > maxDaysMs) return false;

      // 2. 상태 검사
      if (statusFilter === "RETRY" && item.caseStatus !== "RETRY_REQUIRED") {
        return false;
      }
      if (statusFilter === "WAITING" && item.caseStatus !== "WAITING_TEACHER") {
        return false;
      }
      if (
        statusFilter === "RESOLVED" &&
        item.caseStatus !== "RESOLVED" &&
        item.caseStatus !== "TEACHER_CLOSED"
      ) {
        return false;
      }

      // 3. 유형 검사 (ORIGINAL / REVIEW)
      if (kindFilter !== "ALL" && item.kind !== kindFilter) {
        return false;
      }

      // 4. 검색어 (교재명 또는 단원)
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const matchTitle = item.bookTitle.toLowerCase().includes(query);
        const matchProblem = `${item.page} ${item.problemNo}`.includes(query);
        const matchUnit = item.conceptId.toLowerCase().includes(query);
        if (!matchTitle && !matchProblem && !matchUnit) return false;
      }

      return true;
    });
  }, [items, daysFilter, statusFilter, kindFilter, debouncedSearch]);

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          학습 및 풀이 진단 기록
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          지금까지 제출한 수학 문제의 진단 결과와 피드백 이력을 조회할 수 있습니다.
        </p>
      </div>

      {/* 필터 및 검색 바 */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        {/* 검색 인풋 */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="교재명, 페이지 또는 문제 번호로 검색 (예: 개념원리, 48쪽)"
            className="w-full h-11 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
          <span className="absolute left-3.5 top-3 text-slate-400">🔍</span>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* 필터 버튼들 */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          {/* 상태 필터 */}
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              전체 상태
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("RETRY")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === "RETRY"
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              재풀이 필요
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("WAITING")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === "WAITING"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              선생님 확인 중
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("RESOLVED")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === "RESOLVED"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              완료
            </button>
          </div>

          {/* 기간 필터 */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px] mr-1">조회 기간:</span>
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setDaysFilter(days)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                  daysFilter === days
                    ? "bg-blue-100 text-blue-800"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {days}일
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 목록 결과 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>총 {filteredItems.length}건의 학습 기록</span>
          <span>최신 순 정렬</span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            학습 기록을 불러오는 중입니다...
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-3">
            {filteredItems.map((item) => (
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
                        {formatSeoulDateTime(item.createdAt)} 제출 ·{" "}
                        {item.kind === "REVIEW" ? "복습 문제" : "본 문제"}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate mt-0.5">
                        {item.bookTitle} ({item.page}쪽 #{item.problemNo})
                      </h3>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${
                        item.caseStatus === "RESOLVED" || item.caseStatus === "TEACHER_CLOSED"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.caseStatus === "WAITING_TEACHER"
                            ? "bg-amber-100 text-amber-800"
                            : item.caseStatus === "RETRY_REQUIRED"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {CASE_STATUS_LABELS[item.caseStatus]}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      판정:{" "}
                      <strong className="text-slate-800">{VERDICT_LABELS[item.verdict]}</strong>
                    </span>
                    <span>
                      시도: {item.evaluatedCount}/{item.maxEvaluatedCount}회
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="조건에 맞는 학습 기록이 없습니다"
            description="검색어나 필터 조건을 변경해 보시거나 새로운 문제를 제출해 보세요."
            actionText="새 문제 풀이 제출"
            onAction={() => window.location.assign("/student/submissions/new")}
          />
        )}
      </div>
    </div>
  );
}
