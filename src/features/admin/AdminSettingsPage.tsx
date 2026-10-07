/**
 * 원장/대표 운영 설정 메인 페이지
 * features/admin/AdminSettingsPage.tsx
 */

import React, { useEffect, useState, useCallback } from "react";
import type { AdminSettingsDto } from "../../contracts/dto";
import { useAppRepository } from "../../services/data-provider";
import { isSuccessResponse } from "../../contracts/errors";
import { AccountsPanel } from "./AccountsPanel";
import { RelationsPanel } from "./RelationsPanel";
import { PrivacyPanel } from "./PrivacyPanel";
import { AiOperationsPanel } from "./AiOperationsPanel";
import { CorrectionRulesPanel } from "./CorrectionRulesPanel";

type AdminTab = "ACCOUNTS" | "PRIVACY" | "AI_OPS" | "RULES";

export function AdminSettingsPage() {
  const repo = useAppRepository();
  const [activeTab, setActiveTab] = useState<AdminTab>("ACCOUNTS");
  const [settings, setSettings] = useState<AdminSettingsDto | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const res = await repo.getAdminSettings();
    if (isSuccessResponse(res)) {
      setSettings(res.data);
    }
    setLoading(false);
  }, [repo]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (loading || !settings) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 animate-pulse space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="h-4 w-96 bg-slate-100 rounded" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* 상단 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">
            Academy Operations Admin Center
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">원장/대표 운영 관리 센터</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            데모 계정 관리, 담당 교사 배정, 법정대리인 동의 증빙, AI 자동 공개 게이트 및 교정 규칙을
            총괄 제어합니다.
          </p>
        </div>
      </div>

      {/* 4대 핵심 관리 탭 */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("ACCOUNTS")}
          className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "ACCOUNTS"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          계정 및 관계 설정
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PRIVACY")}
          className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "PRIVACY"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          개인정보 및 동의 증빙
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("AI_OPS")}
          className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "AI_OPS"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          AI 운영 모니터링
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("RULES")}
          className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "RULES"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          진단 교정 규칙
        </button>
      </div>

      {/* 패널 영역 */}
      <div>
        {activeTab === "ACCOUNTS" && (
          <div className="space-y-8">
            <AccountsPanel accounts={settings.accounts} onRefresh={loadSettings} />
            <RelationsPanel accounts={settings.accounts} onRefresh={loadSettings} />
          </div>
        )}

        {activeTab === "PRIVACY" && <PrivacyPanel />}

        {activeTab === "AI_OPS" && <AiOperationsPanel />}

        {activeTab === "RULES" && <CorrectionRulesPanel />}
      </div>
    </div>
  );
}
