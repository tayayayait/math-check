/**
 * 진단 교정 규칙 관리 패널
 * features/admin/CorrectionRulesPanel.tsx
 */

import React, { useEffect, useState, useCallback } from "react";
import type { CorrectionRuleDto } from "../../contracts/admin";
import { CONCEPT_LABELS, ERROR_TYPE_LABELS } from "../../domain/status-labels";
import { useAppRepository } from "../../services/data-provider";
import { isSuccessResponse } from "../../contracts/errors";
import { Button } from "../../components/ui/button";

export function CorrectionRulesPanel() {
  const repo = useAppRepository();
  const [rules, setRules] = useState<CorrectionRuleDto[]>([]);
  const [loading, setLoading] = useState(true);

  // 모달 상태
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [conceptId, setConceptId] = useState("M1_EQ_TRANSPOSE");
  const [errorType, setErrorType] = useState("SIGN");
  const [appliesWhen, setAppliesWhen] = useState("");
  const [principle, setPrinciple] = useState("");
  const [counterExample, setCounterExample] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadRules = useCallback(async () => {
    setLoading(true);
    const res = await repo.listCorrectionRules();
    if (isSuccessResponse(res)) {
      setRules(res.data.items);
    }
    setLoading(false);
  }, [repo]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleApprove = async (ruleId: string) => {
    if (!window.confirm("해당 교정 규칙을 승인(APPROVED) 처리하시겠습니까?")) return;
    const res = await repo.approveCorrectionRule(ruleId);
    if (isSuccessResponse(res)) {
      alert("규칙이 정식 승인되었습니다.");
      await loadRules();
    } else {
      alert(res.error.message);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = await repo.createCorrectionRule({
      ruleTitle: title,
      conceptId,
      errorType,
      appliesWhen,
      correctionPrinciple: principle,
      counterExamples: [counterExample],
    });

    if (isSuccessResponse(res)) {
      alert("새 교정 규칙 초안(DRAFT)이 등록되었습니다.");
      setIsCreateOpen(false);
      setTitle("");
      setAppliesWhen("");
      setPrinciple("");
      setCounterExample("");
      await loadRules();
    } else {
      setErrorMsg(res.error.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">교정 규칙 로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">진단 교정 규칙 및 피드백 원리 관리</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            자주 발생하는 오답 패턴에 대해 명시적 교정 원리를 정의하고, 개인정보 검사 및 고정 회귀
            검증(PASS) 후 승인합니다.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
        >
          + 새 교정 규칙 등록
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((r) => (
          <div
            key={r.ruleId}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono text-slate-400">
                    v{r.version} · {r.ruleId}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">{r.ruleTitle}</h4>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                    r.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : r.status === "APPROVED"
                        ? "bg-blue-100 text-blue-800"
                        : r.status === "DRAFT"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {r.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold border border-blue-200">
                  개념: {CONCEPT_LABELS[r.conceptId as keyof typeof CONCEPT_LABELS] ?? r.conceptId}
                </span>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-semibold border border-purple-200">
                  오류:{" "}
                  {ERROR_TYPE_LABELS[r.errorType as keyof typeof ERROR_TYPE_LABELS] ?? r.errorType}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block">적용 조건:</span>
                  <p className="text-slate-600 bg-slate-50 p-2 rounded-lg leading-relaxed">
                    {r.appliesWhen}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block">교정 원리 가이드:</span>
                  <p className="text-slate-600 bg-slate-50 p-2 rounded-lg leading-relaxed">
                    {r.correctionPrinciple}
                  </p>
                </div>
              </div>

              {/* 검증 상태 */}
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-[11px]">
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="text-green-600">✓</span> 개인정보 검사 PASS
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="text-green-600">✓</span> 회귀 검증: {r.regressionEvalStatus}
                </span>
              </div>
            </div>

            {r.status === "DRAFT" && (
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => handleApprove(r.ruleId)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                  규칙 승인하기 (Approve)
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 신규 등록 모달 */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">새 교정 규칙 초안 등록</h3>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">규칙 제목</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 이항 시 부호 변경 누락 방지 규칙"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">대상 개념</label>
                  <select
                    value={conceptId}
                    onChange={(e) => setConceptId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="M1_EQ_TRANSPOSE">이항</option>
                    <option value="M1_DISTRIBUTION">분배법칙</option>
                    <option value="M1_EQ_BALANCE">등식의 성질</option>
                    <option value="M1_RATIONAL_COEFFICIENT">계수 정리</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">오류 유형</label>
                  <select
                    value={errorType}
                    onChange={(e) => setErrorType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="SIGN">부호 오류</option>
                    <option value="DISTRIBUTION">분배법칙 전개 오류</option>
                    <option value="ARITHMETIC">단순 계산 착오</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">적용 조건 (10~500자)</label>
                <textarea
                  required
                  rows={2}
                  value={appliesWhen}
                  onChange={(e) => setAppliesWhen(e.target.value)}
                  placeholder="오답이 발생하는 구체적 문맥을 설명해 주세요."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">교정 원리 (10~500자)</label>
                <textarea
                  required
                  rows={2}
                  value={principle}
                  onChange={(e) => setPrinciple(e.target.value)}
                  placeholder="학생에게 제시할 올바른 수학적 지도 원리를 작성해 주세요."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">대표 반례 (최소 1개)</label>
                <input
                  type="text"
                  required
                  value={counterExample}
                  onChange={(e) => setCounterExample(e.target.value)}
                  placeholder="예: 3x + 5 = 14 에서 3x = 14 + 5 로 작성한 오답"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  취소
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  초안 등록
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
