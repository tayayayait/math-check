/**
 * 교사용 학습 분석 리포트 관리 및 목록 화면
 * features/report/TeacherReportListPage.tsx
 */

import React, { useEffect, useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useAppRepository } from "../../services/data-provider";
import { isSuccessResponse } from "../../contracts/errors";
import type {
  ReportDraftDto,
  ParentPublishedReportDto,
  TeacherLearnerDto,
} from "../../contracts/dto";
import { formatSeoulDate } from "../../domain/seoul-date";
import { Button } from "../../components/ui/button";
import { ReportRequestForm } from "./ReportRequestForm";

export function TeacherReportListPage() {
  const repo = useAppRepository();

  const [activeTab, setActiveTab] = useState<"REQUESTED" | "DRAFT" | "PUBLISHED" | "WITHDRAWN">(
    "REQUESTED",
  );
  const [drafts, setDrafts] = useState<ReportDraftDto[]>([]);
  const [published, setPublished] = useState<ParentPublishedReportDto[]>([]);
  const [learners, setLearners] = useState<TeacherLearnerDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 구두 요청 등록 모달 상태
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const [reportsRes, learnersRes] = await Promise.all([repo.listReports(), repo.listLearners()]);

    if (isSuccessResponse(reportsRes)) {
      setDrafts(reportsRes.data.drafts);
      setPublished(reportsRes.data.published);
    }
    if (isSuccessResponse(learnersRes)) {
      setLearners(learnersRes.data.items);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [repo]);

  // 구두 요청 제출 핸들러
  const handleCreateOralRequest = async (data: {
    learnerId: string;
    fromDate: string;
    toDate: string;
    oralMemo?: string;
  }) => {
    const res = await repo.requestReport(data.learnerId, data.fromDate, data.toDate);
    if (isSuccessResponse(res)) {
      alert("리포트 요청이 정상 접수되었습니다.");
      await loadData();
    } else {
      throw new Error(res.error.message);
    }
  };

  // 탭별 목록 분기
  const currentList = useMemo(() => {
    if (activeTab === "PUBLISHED") {
      return published;
    }
    if (activeTab === "WITHDRAWN") {
      return drafts.filter((d) => d.status === "WITHDRAWN");
    }
    if (activeTab === "REQUESTED") {
      // 오래된 요청순 (createdAt ASC)
      return drafts
        .filter((d) => d.status === "REQUESTED")
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    // DRAFT (최근 수정순)
    return drafts
      .filter((d) => d.status === "DRAFT")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [drafts, published, activeTab]);

  return (
    <div className="space-y-6 pb-12">
      {/* 상단 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs text-blue-600 font-bold">선생님 리포트 센터</span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            학습 분석 리포트 관리
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            학부모 요청 접수 건을 처리하고, 정성 총평과 가정 연계 질문을 작성하여 정식 발행합니다.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsRequestModalOpen(true)}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          + 구두/유선 요청 수기 등록
        </Button>
      </div>

      {/* 4개 탭 바 */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("REQUESTED")}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "REQUESTED"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          요청 대기 ({drafts.filter((d) => d.status === "REQUESTED").length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("DRAFT")}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "DRAFT"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          작성 중인 초안 ({drafts.filter((d) => d.status === "DRAFT").length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PUBLISHED")}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "PUBLISHED"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          정식 발행 완료 ({published.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("WITHDRAWN")}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "WITHDRAWN"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          회수 이력 ({drafts.filter((d) => d.status === "WITHDRAWN").length})
        </button>
      </div>

      {/* 목록 렌더링 */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          리포트 목록을 불러오는 중입니다...
        </div>
      ) : currentList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentList.map((item) => (
            <Link
              key={item.reportId}
              to="/teacher/reports/$reportId"
              params={{ reportId: item.reportId }}
              className="block group"
            >
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-base font-bold text-slate-900 group-hover:text-blue-600">
                      {item.learnerName} 학생
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      분석 기간: {formatSeoulDate(item.fromDate)} ~ {formatSeoulDate(item.toDate)}
                    </span>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      item.status === "REQUESTED"
                        ? "bg-amber-100 text-amber-800"
                        : item.status === "DRAFT"
                          ? "bg-blue-100 text-blue-800"
                          : item.status === "PUBLISHED"
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">분석 문항</span>
                    <strong className="text-slate-800 font-bold tabular-nums">
                      {item.metricsSummary.totalOriginalProblems}개
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">최초 정답률</span>
                    <strong className="text-slate-800 font-bold tabular-nums">
                      {item.metricsSummary.initialAccuracyPercent !== null
                        ? `${item.metricsSummary.initialAccuracyPercent.toFixed(1)}%`
                        : "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">재풀이 완료율</span>
                    <strong className="text-blue-600 font-bold tabular-nums">
                      {item.metricsSummary.retrySuccessRatePercent !== null
                        ? `${item.metricsSummary.retrySuccessRatePercent.toFixed(1)}%`
                        : "—"}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-400 text-[11px]">
                    작성일:{" "}
                    {formatSeoulDate("publishedAt" in item ? item.publishedAt : item.updatedAt)}
                  </span>
                  <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                    {activeTab === "PUBLISHED" ? "리포트 보기 →" : "초안 작성 및 발행 →"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
          해당 상태의 리포트가 없습니다.
        </div>
      )}

      {/* 구두 요청 등록 모달 */}
      {isRequestModalOpen && (
        <ReportRequestForm
          learners={learners.map((l) => ({ learnerId: l.learnerId, name: l.name }))}
          isTeacher={true}
          onClose={() => setIsRequestModalOpen(false)}
          onSubmit={handleCreateOralRequest}
        />
      )}
    </div>
  );
}
