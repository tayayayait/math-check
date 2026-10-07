import React, { useEffect, useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useAppRepository } from "../../services/data-provider";
import type { ParentPublishedReportDto } from "../../contracts/dto";
import { AppErrorState } from "../../components/app/AppErrorState";
import { ReportPrintView } from "./ReportPrintView";
import { REPORT_STATUS_LABELS } from "../../domain/status-labels";
import { Button } from "../../components/ui/button";

export function ParentReportPage() {
  const params = useParams({ strict: false }) as { reportId?: string };
  const reportId = params.reportId ?? "";
  const repository = useAppRepository();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ParentPublishedReportDto | null>(null);
  const [errorStatus, setErrorStatus] = useState<403 | 404 | 500 | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    async function loadReport() {
      if (!reportId) {
        setErrorStatus(404);
        setErrorMessage("리포트 ID가 올바르지 않습니다.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await repository.getPublishedReport(reportId);
        if (!isMounted) return;

        if ("data" in res) {
          setReport(res.data);
          setErrorStatus(null);
        } else {
          if (res.error.code === "NOT_FOUND") {
            setErrorStatus(404);
          } else if (res.error.code === "FORBIDDEN") {
            setErrorStatus(403);
          } else {
            setErrorStatus(500);
          }
          setErrorMessage(res.error.message);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setErrorStatus(500);
        setErrorMessage("리포트를 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadReport();
    return () => {
      isMounted = false;
    };
  }, [reportId, repository]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-neutral-200 rounded" />
        <div className="h-40 bg-neutral-100 rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-neutral-100 rounded-lg" />
          <div className="h-24 bg-neutral-100 rounded-lg" />
          <div className="h-24 bg-neutral-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (errorStatus) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <AppErrorState
          status={errorStatus}
          title={errorStatus === 404 ? "리포트를 찾을 수 없습니다" : "접근 불가"}
          description={errorMessage || "요청하신 리포트가 존재하지 않거나 열람 권한이 없습니다."}
          actionText="보호자 홈으로 돌아가기"
          actionHref="/parent"
        />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <AppErrorState
          status={404}
          title="리포트 정보 없음"
          description="리포트 데이터가 비어 있습니다."
          actionText="보호자 홈으로 돌아가기"
          actionHref="/parent"
        />
      </div>
    );
  }

  // 회수된 상태인 경우
  if (report.status === "WITHDRAWN") {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <div className="p-6 bg-warning-50 border border-warning-200 rounded-xl text-center space-y-3">
          <div className="inline-block p-3 bg-warning-100 rounded-full text-warning-700">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-800">회수된 학습 분석 리포트입니다</h2>
          <p className="text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
            해당 리포트는 담당 교사에 의해 회수 처리되었습니다. 분석 데이터 수정 후 재발행될
            예정이오니 잠시 기다려 주시거나 담당 선생님께 문의해 주세요.
          </p>
          <div className="pt-2">
            <Link to="/parent">
              <Button variant="outline">보호자 홈으로 돌아가기</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* 화면 전용 헤더 및 인쇄 액션 바 (인쇄 시 no-print로 자동 숨김) */}
      <div className="no-print flex items-center justify-between pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <Link
            to="/parent"
            className="text-neutral-500 hover:text-neutral-700 text-sm flex items-center gap-1 font-medium"
          >
            ← 보호자 홈
          </Link>
          <span className="text-neutral-300">|</span>
          <span className="text-xs px-2.5 py-1 bg-green-100 text-green-800 rounded-full font-bold">
            {REPORT_STATUS_LABELS[report.status] ?? report.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            className="bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            리포트 인쇄 / PDF 저장
          </Button>
        </div>
      </div>

      {/* 리포트 카드 뷰 (인쇄 시 ReportPrintView 스타일 자동 적용) */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-neutral-200 shadow-sm print:p-0 print:border-none print:shadow-none">
        <ReportPrintView report={report} />
      </div>
    </div>
  );
}
