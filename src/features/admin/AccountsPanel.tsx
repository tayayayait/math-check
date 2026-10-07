/**
 * 계정 관리 패널 (원장/대표 전용)
 * features/admin/AccountsPanel.tsx
 */

import React, { useState } from "react";
import type { AdminSettingsDto } from "../../contracts/dto";
import { ROLE_LABELS } from "../../domain/status-labels";
import { useAppRepository } from "../../services/data-provider";
import { isSuccessResponse } from "../../contracts/errors";
import { Button } from "../../components/ui/button";

interface AccountsPanelProps {
  accounts: AdminSettingsDto["accounts"];
  onRefresh: () => void;
}

export function AccountsPanel({ accounts, onRefresh }: AccountsPanelProps) {
  const repo = useAppRepository();
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // 모달 상태
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState<"STUDENT" | "TEACHER" | "PARENT">("STUDENT");
  const [newName, setNewName] = useState("");
  const [newInternalNo, setNewInternalNo] = useState("");
  const [newGrade, setNewGrade] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 임시 비밀번호 1회 표시 모달
  const [tempPasswordModal, setTempPasswordModal] = useState<{
    actorId: string;
    name: string;
    password: string;
  } | null>(null);

  const filteredAccounts = accounts.filter((a) => roleFilter === "ALL" || a.role === roleFilter);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = await repo.createAccount({
      role: newRole,
      name: newName,
      internalNo: newInternalNo,
      gradeLevel: newRole === "STUDENT" ? newGrade : undefined,
    });

    if (isSuccessResponse(res)) {
      setIsCreateOpen(false);
      setNewName("");
      setNewInternalNo("");
      onRefresh();
      if (res.data.tempPassword) {
        setTempPasswordModal({
          actorId: res.data.actorId,
          name: newName,
          password: res.data.tempPassword,
        });
      }
    } else {
      setErrorMessage(res.error.message);
    }
  };

  const handleToggleStatus = async (actorId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const actionName = nextStatus === "ACTIVE" ? "활성화" : "일시 중지";
    if (!window.confirm(`해당 계정을 ${actionName} 처리하시겠습니까?`)) return;

    const res = await repo.updateAccountStatus({
      actorId,
      status: nextStatus,
      reason: `${actionName} 관리자 수동 처리`,
    });

    if (isSuccessResponse(res)) {
      onRefresh();
    } else {
      alert(res.error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {["ALL", "STUDENT", "TEACHER", "PARENT"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                roleFilter === r
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {r === "ALL" ? "전체" : (ROLE_LABELS[r as keyof typeof ROLE_LABELS] ?? r)}
            </button>
          ))}
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
        >
          + 신규 계정 등록
        </Button>
      </div>

      {/* 계정 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">역할</th>
                <th className="px-4 py-3">성명</th>
                <th className="px-4 py-3">식별자 (ActorId)</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.map((acc) => (
                <tr key={acc.actorId} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        acc.role === "STUDENT"
                          ? "bg-blue-50 text-blue-700"
                          : acc.role === "TEACHER"
                            ? "bg-purple-50 text-purple-700"
                            : acc.role === "PARENT"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {ROLE_LABELS[acc.role] ?? acc.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{acc.name}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{acc.actorId}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        acc.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {acc.status === "ACTIVE" ? "정상 활성" : "일시 중지"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {acc.role !== "ADMIN" && (
                      <button
                        onClick={() => handleToggleStatus(acc.actorId, acc.status)}
                        className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                          acc.status === "ACTIVE"
                            ? "text-red-600 hover:bg-red-50"
                            : "text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {acc.status === "ACTIVE" ? "중지" : "활성화"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 신규 계정 등록 모달 */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">신규 데모 계정 생성</h3>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">계정 역할</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["STUDENT", "TEACHER", "PARENT"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNewRole(r)}
                      className={`py-2 text-xs rounded-xl font-bold border transition-colors ${
                        newRole === r
                          ? "bg-blue-50 border-blue-600 text-blue-700"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  성명 (1~30자)
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  관리번호 / 학번 (영문, 숫자, 하이픈)
                </label>
                <input
                  type="text"
                  required
                  value={newInternalNo}
                  onChange={(e) => setNewInternalNo(e.target.value)}
                  placeholder="예: STU-2026-09"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:border-blue-600"
                />
              </div>

              {newRole === "STUDENT" && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">학년</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  >
                    {[1, 2, 3].map((g) => (
                      <option key={g} value={g}>
                        중학교 {g}학년
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="text-xs"
                >
                  취소
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                  계정 생성
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 임시 비밀번호 1회 표시 안내 모달 */}
      {tempPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto text-xl">
              🔑
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">임시 비밀번호 발급 안내</h3>
              <p className="text-xs text-slate-500 mt-1">
                <strong>{tempPasswordModal.name}</strong> 님의 계정이 생성되었습니다.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-bold text-blue-700 tracking-wider select-all">
              {tempPasswordModal.password}
            </div>

            <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg text-left">
              ※ 본 임시 비밀번호는 보안상 창을 닫으면 <strong>다시 조회할 수 없습니다</strong>. 학생
              또는 학부모에게 전달 후 첫 로그인 시 비밀번호 변경을 안내해 주세요.
            </p>

            <Button
              onClick={() => setTempPasswordModal(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs"
            >
              확인 후 닫기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
