import React, { useEffect, useState, useTransition } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAppRepository } from "../../services/data-provider";
import { useDemoSession } from "../auth/DemoSessionProvider";
import type { ParentPublishedReportDto, ReportDraftDto } from "../../contracts/dto";
import { ReportRequestForm } from "./ReportRequestForm";
import { Button } from "../../components/ui/button";
import { REPORT_STATUS_LABELS } from "../../domain/status-labels";
import { formatSeoulDate } from "../../domain/seoul-date";

export function ParentHomePage() {
  const repository = useAppRepository();
  const { session, logout } = useDemoSession();
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  // 자녀 목록 (세션의 availableLearners에서 ACTIVE 상태인 자녀)
  const activeLearners = (session?.availableLearners || []).filter(
    (l) => l.relationStatus === "ACTIVE",
  );

  const [selectedLearnerId, setSelectedLearnerId] = useState<string>(
    activeLearners[0]?.learnerId ?? "",
  );
  const [publishedReports, setPublishedReports] = useState<ParentPublishedReportDto[]>([]);
  const [pendingDrafts, setPendingDrafts] = useState<ReportDraftDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const selectedLearner = activeLearners.find((l) => l.learnerId === selectedLearnerId);

  // 리포트 목록 로드
  const loadReports = async (learnerId: string) => {
    if (!learnerId) {
      setPublishedReports([]);
      setPendingDrafts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await repository.listReports(learnerId);
      if ("data" in res) {
        // publishedAt 역순 정렬
        const sortedPublished = [...res.data.published].sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
        );
        setPublishedReports(sortedPublished);

        // 요청/초안 대기 건
        const pending = res.data.drafts.filter(
          (d) => d.status === "REQUESTED" || d.status === "DRAFT",
        );
        setPendingDrafts(pending);
      }
    } catch (err: unknown) {
      console.error("리포트 목록 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedLearnerId && activeLearners.length > 0) {
      setSelectedLearnerId(activeLearners[0]?.learnerId ?? "");
    }
  }, [activeLearners, selectedLearnerId]);

  useEffect(() => {
    if (selectedLearnerId) {
      loadReports(selectedLearnerId);
    } else {
      setLoading(false);
    }
  }, [selectedLearnerId]);

  // 리포트 요청 제출 핸들러
  const handleRequestSubmit = async (data: {
    learnerId: string;
    fromDate: string;
    toDate: string;
  }) => {
    const res = await repository.requestReport(data.learnerId, data.fromDate, data.toDate);
    if ("error" in res) {
      throw new Error(res.error.message);
    }
    setNotification("학습 분석 리포트가 성공적으로 요청되었습니다.");
    await loadReports(selectedLearnerId);
    setTimeout(() => setNotification(null), 4000);
  };

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center text-sm text-neutral-500 animate-pulse">
        사용자 세션을 불러오는 중입니다...
      </div>
    );
  }

  // 자녀가 0명인 경우: 연결 안내 + 계정/로그아웃 제공
  if (activeLearners.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-800">연결된 자녀 계정이 없습니다</h2>
          <p className="text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
            현재 보호자 계정에 연동된 학생 정보가 없습니다. 학원 또는 담당 교사에게 문의하여 자녀
            계정과 연동해 주시기 바랍니다.
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <Link to="/account">
              <Button variant="outline">내 계정 정보 확인</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                logout();
                startTransition(() => {
                  navigate({ to: "/login" });
                });
              }}
            >
              로그아웃
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* 알림 메시지 */}
      {notification && (
        <div className="p-4 bg-success-50 border border-success-200 text-success-800 rounded-xl text-sm flex items-center justify-between">
          <span>{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-success-600 hover:text-success-800 text-xs font-bold"
          >
            닫기
          </button>
        </div>
      )}

      {/* 상단 헤더 및 자녀 선택 영역 */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
            학부모 안심 리포트
          </span>
          <h1 className="text-2xl font-bold text-neutral-900 mt-1">자녀 수학 학습 리포트</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            AI 진단과 선생님의 전문 피드백을 통해 자녀의 수학 학습 현황과 성장 추이를 확인하세요.
          </p>
        </div>

        {/* 자녀 선택 (1명이면 읽기 전용, 2명 이상이면 탭/선택기) */}
        <div className="flex items-center gap-3 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
          <span className="text-xs font-medium text-neutral-500 shrink-0">대상 자녀:</span>
          {activeLearners.length === 1 ? (
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-800 text-sm">{activeLearners[0]?.name}</span>
              <span className="text-xs text-neutral-500 bg-white px-2 py-0.5 rounded border border-neutral-200">
                중{activeLearners[0]?.gradeLevel}
              </span>
            </div>
          ) : (
            <div className="flex gap-1.5">
              {activeLearners.map((learner) => (
                <button
                  key={learner.learnerId}
                  onClick={() => setSelectedLearnerId(learner.learnerId)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    selectedLearnerId === learner.learnerId
                      ? "bg-primary-600 text-white font-bold"
                      : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100"
                  }`}
                >
                  {learner.name} (중{learner.gradeLevel})
                </button>
              ))}
            </div>
          )}

          <Button
            size="sm"
            onClick={() => setIsRequestModalOpen(true)}
            className="ml-2 bg-primary-600 hover:bg-primary-700 text-white font-medium text-xs whitespace-nowrap"
          >
            + 새 리포트 요청
          </Button>
        </div>
      </div>

      {/* 요청/초안 대기 중 카드 (있는 경우 표시) */}
      {pendingDrafts.length > 0 && (
        <div className="bg-primary-50/50 border border-primary-200 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-primary-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
            작성 준비 중인 리포트 ({pendingDrafts.length}건)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingDrafts.map((draft) => (
              <div
                key={draft.reportId}
                className="bg-white p-4 rounded-xl border border-primary-100 shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-700">
                      분석 기간: {formatSeoulDate(draft.fromDate)} ~ {formatSeoulDate(draft.toDate)}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                      {REPORT_STATUS_LABELS[draft.status] ?? draft.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    담당 선생님께서 학생의 풀이 데이터를 정밀 분석하여 리포트를 작성 중입니다.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 발행된 리포트 목록 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
            발행된 학습 분석 리포트
            <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
              {publishedReports.length}건
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-44 bg-neutral-100 rounded-xl animate-pulse" />
            <div className="h-44 bg-neutral-100 rounded-xl animate-pulse" />
          </div>
        ) : publishedReports.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-neutral-200 text-center space-y-3">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-neutral-700">발행된 분석 리포트가 없습니다</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              상단의 [새 리포트 요청] 버튼을 눌러 자녀의 학습 진단 리포트를 신청하시면 담당 선생님의
              검토 후 발행됩니다.
            </p>
            <Button
              onClick={() => setIsRequestModalOpen(true)}
              variant="outline"
              size="sm"
              className="mt-2 text-xs"
            >
              리포트 요청하기
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publishedReports.map((report) => (
              <div
                key={report.reportId}
                className="bg-white p-5 rounded-2xl border border-neutral-200 hover:border-primary-400 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-neutral-400">
                        발행일: {formatSeoulDate(report.publishedAt)}
                      </span>
                      <h3 className="text-base font-bold text-neutral-900 mt-0.5">
                        {report.learnerName} 학생 학습 분석
                      </h3>
                      <p className="text-xs text-neutral-500">
                        기간: {formatSeoulDate(report.fromDate)} ~ {formatSeoulDate(report.toDate)}
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-green-100 text-green-800">
                      {REPORT_STATUS_LABELS[report.status] ?? report.status}
                    </span>
                  </div>

                  {/* 3대 핵심 요약 지표 프리뷰 */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-neutral-100 text-center">
                    <div>
                      <span className="text-[11px] text-neutral-400 block">분석 문제 수</span>
                      <span className="text-sm font-bold text-neutral-800">
                        {report.metricsSummary.totalOriginalProblems}문항
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-400 block">최초 정답률</span>
                      <span className="text-sm font-bold text-primary-700">
                        {report.metricsSummary.initialAccuracyPercent !== null
                          ? `${report.metricsSummary.initialAccuracyPercent.toFixed(1)}%`
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-400 block">재풀이 완료율</span>
                      <span className="text-sm font-bold text-success-700">
                        {report.metricsSummary.retrySuccessRatePercent !== null
                          ? `${report.metricsSummary.retrySuccessRatePercent.toFixed(1)}%`
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {/* 선생님 총평 미리보기 1줄 */}
                  <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                    "{report.teacherComment}"
                  </p>
                </div>

                <div className="pt-4 mt-2 flex items-center justify-between border-t border-neutral-100">
                  <span className="text-xs text-neutral-400">
                    가정 연계 질문 {report.homeQuestions.length}개
                  </span>
                  <Link to="/parent/reports/$reportId" params={{ reportId: report.reportId }}>
                    <Button
                      size="sm"
                      className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold"
                    >
                      상세 리포트 보기 →
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 리포트 요청 모달 */}
      {isRequestModalOpen && selectedLearner && (
        <ReportRequestForm
          learners={activeLearners.map((l) => ({ learnerId: l.learnerId, name: l.name }))}
          defaultLearnerId={selectedLearner.learnerId}
          isTeacher={false}
          onClose={() => setIsRequestModalOpen(false)}
          onSubmit={async (data) => {
            await handleRequestSubmit(data);
            setIsRequestModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
