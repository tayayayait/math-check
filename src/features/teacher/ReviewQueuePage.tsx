import React, { useEffect, useState, useMemo } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { useAppRepository } from "../../services/data-provider";
import { CASE_STATUS_LABELS, VERDICT_LABELS } from "../../domain/status-labels";
import { formatSeoulDateTime } from "../../domain/seoul-date";
import { isSuccessResponse } from "../../contracts/errors";
import type { TeacherReviewQueueItemDto } from "../../contracts/dto";

export function ReviewQueuePage() {
  const repo = useAppRepository();

  const [items, setItems] = useState<TeacherReviewQueueItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 3개 탭: 'CONFIRM' (진단 확인) | 'HELP' (설명 필요) | 'CANDIDATE' (복습 후보)
  const [activeTab, setActiveTab] = useState<"CONFIRM" | "HELP" | "CANDIDATE">("CONFIRM");

  // 필터
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    async function loadQueue() {
      setIsLoading(true);
      const res = await repo.listReviewQueue();
      if (isSuccessResponse(res)) {
        setItems(res.data.items);
      }
      setIsLoading(false);
    }
    loadQueue();
  }, [repo]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 탭별 분기
      if (activeTab === "HELP") {
        if (!item.helpRequested) return false;
      } else if (activeTab === "CONFIRM") {
        // 일반 확인 대기 (도움 요청이 아니거나 판정 검수 대상)
        if (item.helpRequested) return false;
      } else if (activeTab === "CANDIDATE") {
        // 복습 문제 후보 대기
        return false; // 복습 후보는 Phase 6에서 연결
      }

      // 상태 필터
      if (statusFilter !== "ALL" && (item.reviewStatus ?? "PENDING") !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [items, activeTab, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            진단 검수 대기열
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            AI 진단 검토가 필요하거나 학생이 직접 질문한 문제 목록을 확인하고 피드백을 제공합니다.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-800 rounded-full w-fit">
          총 {items.length}건 대기 중
        </span>
      </div>

      {/* 3개 탭 전환 네비게이션 */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("CONFIRM")}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === "CONFIRM"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          진단 확인 대기
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("HELP")}
          className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "HELP"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>설명 필요 (도움 요청)</span>
          <span className="text-[11px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full">
            {items.filter((i) => i.helpRequested).length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("CANDIDATE")}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === "CANDIDATE"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          복습 후보 문제 (Phase 6)
        </button>
      </div>

      {/* 상태 필터 바 */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-500 font-medium">검수 상태:</span>
        {["ALL", "PENDING", "IN_REVIEW"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              statusFilter === st
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {st === "ALL" ? "전체" : st === "PENDING" ? "검수 대기" : "검수 진행 중"}
          </button>
        ))}
      </div>

      {/* 대기열 목록 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            대기열 목록을 불러오고 있습니다...
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((item) => (
              <Link
                key={item.caseId}
                to="/teacher/cases/$caseId"
                params={{ caseId: item.caseId }}
                className="block p-4 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600">
                        {item.bookTitle ?? "수학 1"} ({item.page ?? 1}쪽 #{item.problemNo ?? "1"})
                      </span>
                      <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded">
                        {item.learnerName}
                      </span>
                      {item.helpRequested && (
                        <span className="text-[11px] px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full">
                          🙋 질문 접수
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      단원: {item.conceptId} · 시도 {item.evaluatedCount ?? 1}회 · 접수:{" "}
                      {formatSeoulDateTime(
                        item.submittedAt || item.createdAt || new Date().toISOString(),
                      )}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-block ${
                        item.reviewStatus === "IN_REVIEW"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.reviewStatus === "IN_REVIEW" ? "검수 중 (5분 임시)" : "대기 중"}
                    </span>
                    <span className="block text-[11px] text-blue-600 font-medium mt-1 group-hover:underline">
                      검수하기 →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400">
            현재 조건에 해당하는 검수 대기 항목이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
