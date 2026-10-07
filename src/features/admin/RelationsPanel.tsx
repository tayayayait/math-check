/**
 * 담당 교사 및 보호자 관계 설정 패널
 * features/admin/RelationsPanel.tsx
 */

import React, { useState } from "react";
import type { AdminSettingsDto } from "../../contracts/dto";
import { useAppRepository } from "../../services/data-provider";
import { isSuccessResponse } from "../../contracts/errors";
import { Button } from "../../components/ui/button";

interface RelationsPanelProps {
  accounts: AdminSettingsDto["accounts"];
  onRefresh: () => void;
}

export function RelationsPanel({ accounts, onRefresh }: RelationsPanelProps) {
  const repo = useAppRepository();

  const students = accounts.filter((a) => a.role === "STUDENT");
  const teachers = accounts.filter((a) => a.role === "TEACHER");
  const parents = accounts.filter((a) => a.role === "PARENT");

  // 편집 모달 상태
  const [editingStudent, setEditingStudent] = useState<{
    learnerId: string;
    name: string;
  } | null>(null);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenEdit = (learnerId: string, name: string) => {
    // 기본 선택값 (현재 데모 기준 1명씩 기본 매핑)
    setSelectedTeacherIds(["usr_teacher_01"]);
    setSelectedParentIds(["usr_parent_01"]);
    setEditingStudent({ learnerId, name });
    setErrorMsg(null);
  };

  const handleSaveRelations = async () => {
    if (!editingStudent) return;
    setErrorMsg(null);

    const res = await repo.assignRelations({
      learnerId: editingStudent.learnerId,
      teacherIds: selectedTeacherIds,
      parentIds: selectedParentIds,
    });

    if (isSuccessResponse(res)) {
      alert("담당 교사 및 보호자 연결 관계가 성공적으로 업데이트되었습니다.");
      setEditingStudent(null);
      onRefresh();
    } else {
      setErrorMsg(res.error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">학습 담당 및 보호자 연결 관리</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            학생 1명당 담당 교사는 <strong>최대 4명</strong>, 보호자 계정은{" "}
            <strong>최대 2명</strong>까지 배정할 수 있습니다.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
            <tr>
              <th className="px-4 py-3">학생명</th>
              <th className="px-4 py-3">학번/식별자</th>
              <th className="px-4 py-3">배정 담당 교사</th>
              <th className="px-4 py-3">연결 보호자</th>
              <th className="px-4 py-3 text-right">설정</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((stu) => (
              <tr key={stu.actorId} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-bold text-slate-900">{stu.name}</td>
                <td className="px-4 py-3 font-mono text-slate-500">{stu.actorId}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[11px] font-semibold border border-purple-200">
                      박선생 (usr_teacher_01)
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-semibold border border-emerald-200">
                      김학부모 (usr_parent_01)
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleOpenEdit(stu.actorId, stu.name)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-semibold px-2 py-1 rounded hover:bg-blue-50"
                  >
                    관계 수정
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 관계 수정 모달 */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingStudent.name} 학생 관계 배정
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                담당 교사 (최대 4명) 및 연결 보호자 (최대 2명)를 선택해 주세요.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                {errorMsg}
              </div>
            )}

            {/* 교사 배정 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                담당 교사 배정 ({selectedTeacherIds.length}/4명)
              </label>
              <div className="grid grid-cols-2 gap-2 border border-slate-200 p-3 rounded-xl max-h-36 overflow-y-auto">
                {teachers.map((t) => {
                  const checked = selectedTeacherIds.includes(t.actorId);
                  return (
                    <label
                      key={t.actorId}
                      className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (checked) {
                            setSelectedTeacherIds(
                              selectedTeacherIds.filter((id) => id !== t.actorId),
                            );
                          } else {
                            setSelectedTeacherIds([...selectedTeacherIds, t.actorId]);
                          }
                        }}
                      />
                      <span>{t.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 보호자 연결 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                연결 보호자 ({selectedParentIds.length}/2명)
              </label>
              <div className="grid grid-cols-2 gap-2 border border-slate-200 p-3 rounded-xl max-h-36 overflow-y-auto">
                {parents.map((p) => {
                  const checked = selectedParentIds.includes(p.actorId);
                  return (
                    <label
                      key={p.actorId}
                      className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (checked) {
                            setSelectedParentIds(
                              selectedParentIds.filter((id) => id !== p.actorId),
                            );
                          } else {
                            setSelectedParentIds([...selectedParentIds, p.actorId]);
                          }
                        }}
                      />
                      <span>{p.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingStudent(null)}
                className="text-xs"
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleSaveRelations}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                변경사항 저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
