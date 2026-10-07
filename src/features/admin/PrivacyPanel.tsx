/**
 * 개인정보 보호, 동의 증빙 및 삭제 요청 관리 패널
 * features/admin/PrivacyPanel.tsx
 */

import React, { useEffect, useState, useCallback } from "react";
import type { ConsentRecordDto, DeletionRequestDto } from "../../contracts/admin";
import { useAppRepository } from "../../services/data-provider";
import { isSuccessResponse } from "../../contracts/errors";
import { formatSeoulDate } from "../../domain/seoul-date";
import { Button } from "../../components/ui/button";

export function PrivacyPanel() {
  const repo = useAppRepository();
  const [consents, setConsents] = useState<ConsentRecordDto[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequestDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [cRes, dRes] = await Promise.all([repo.listConsents(), repo.listDeletionRequests()]);
    if (isSuccessResponse(cRes)) setConsents(cRes.data.items);
    if (isSuccessResponse(dRes)) setDeletionRequests(dRes.data.items);
    setLoading(false);
  }, [repo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 삭제 요청 상태 단계 진행 핸들러 (데모 시연)
  const handleStepDeletion = async (requestId: string) => {
    const res = await repo.stepDeletionDemo(requestId);
    if (isSuccessResponse(res)) {
      alert(`삭제 요청 상태가 '${res.data.status}' 단계로 전이되었습니다.`);
      await loadData();
    } else {
      alert(res.error.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">데이터 로딩 중...</div>;
  }

  return (
    <div className="space-y-8">
      {/* 1. 개인정보 처리 및 법정대리인 동의 증빙 */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">법정대리인 동의 증빙 및 동의 현황</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            만 14세 미만 학생은 법정대리인의 서면 동의서 또는 본인확인 완료 계정을 통해 증빙을
            확인합니다.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">학생명</th>
                  <th className="px-4 py-3">연령 구분</th>
                  <th className="px-4 py-3">법정대리인</th>
                  <th className="px-4 py-3">핵심 학습</th>
                  <th className="px-4 py-3">외부 AI 분석</th>
                  <th className="px-4 py-3">학부모 리포트</th>
                  <th className="px-4 py-3">증빙 상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consents.map((c) => (
                  <tr key={c.consentId} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-bold text-slate-900">{c.learnerName}</td>
                    <td className="px-4 py-3">
                      {c.isUnder14 ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[11px] font-bold">
                          만 14세 미만
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px]">
                          일반
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {c.legalGuardianName || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          c.coreLearningConsent
                            ? "text-green-600 font-bold"
                            : "text-red-500 font-bold"
                        }
                      >
                        {c.coreLearningConsent ? "동의 완료" : "미동의"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          c.externalAiConsent ? "text-green-600 font-bold" : "text-slate-400"
                        }
                      >
                        {c.externalAiConsent ? "동의 완료" : "미동의 (수동 검토)"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          c.parentReportConsent ? "text-green-600 font-bold" : "text-slate-400"
                        }
                      >
                        {c.parentReportConsent ? "동의 완료" : "미동의 (발행 제한)"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          c.proofStatus === "VERIFIED"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {c.proofStatus === "VERIFIED" ? "증빙 완료" : "증빙 서류 대기"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. 데이터 보관 및 파기 정책 안내 카드 */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>🛡️</span> 서비스 데이터 보관 및 자동 만료 정책
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          본 도안은 교육 프라이버시 보호 기준에 따라 항목별 만료 주기를 정의하며, 만료된 원본
          이미지는 즉시 비식별화 처리됩니다.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-400 block font-medium">
              손글씨 원본/정제 사진
            </span>
            <span className="text-base font-bold text-slate-800">90일 보관</span>
            <p className="text-[10px] text-slate-500 mt-0.5">만료 시 텍스트 진단만 유지</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-400 block font-medium">
              학습 풀이 및 성취 이력
            </span>
            <span className="text-base font-bold text-slate-800">365일 보관</span>
            <p className="text-[10px] text-slate-500 mt-0.5">재원 중 및 퇴원 후 1년</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-400 block font-medium">
              AI 진단 및 OCR 로그
            </span>
            <span className="text-base font-bold text-slate-800">30일 보관</span>
            <p className="text-[10px] text-slate-500 mt-0.5">디버깅용 익명화 로그</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-400 block font-medium">
              업무 및 접근 감사 로그
            </span>
            <span className="text-base font-bold text-slate-800">180일 보관</span>
            <p className="text-[10px] text-slate-500 mt-0.5">보안 및 감사용 고정 기록</p>
          </div>
        </div>
      </div>

      {/* 3. 계정 및 데이터 삭제 요청 관리 */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            계정 탈퇴 및 개인정보 삭제 요청 처리
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            삭제 요청 접수 시 즉시 접근 차단(BLOCKED) 상태로 전환되며, 단계별 파기 절차를 모의
            시연할 수 있습니다.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">요청자</th>
                <th className="px-4 py-3">요청 사유</th>
                <th className="px-4 py-3">접수 일시</th>
                <th className="px-4 py-3">처리 상태</th>
                <th className="px-4 py-3 text-right">시연 단계</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deletionRequests.map((req) => (
                <tr key={req.requestId} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-bold text-slate-900">{req.actorName}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{req.reason}</td>
                  <td className="px-4 py-3 text-slate-400">{formatSeoulDate(req.requestedAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        req.status === "REQUESTED"
                          ? "bg-slate-100 text-slate-700"
                          : req.status === "BLOCKED"
                            ? "bg-amber-100 text-amber-800"
                            : req.status === "PURGING"
                              ? "bg-blue-100 text-blue-800 animate-pulse"
                              : "bg-green-100 text-green-800"
                      }`}
                    >
                      {req.status === "REQUESTED" && "접수됨"}
                      {req.status === "BLOCKED" && "접근 차단 (BLOCKED)"}
                      {req.status === "PURGING" && "파기 진행 중 (PURGING)"}
                      {req.status === "COMPLETED" && "삭제 완료 (COMPLETED)"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {req.status !== "COMPLETED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStepDeletion(req.requestId)}
                        className="text-[11px] h-7 px-2"
                      >
                        다음 단계 진행 →
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
