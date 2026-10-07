import React, { useEffect, useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useAppRepository } from "../../services/data-provider";
import { isSuccessResponse } from "../../contracts/errors";
import type { TeacherLearnerDto } from "../../contracts/dto";

export function StudentListPage() {
  const repo = useAppRepository();

  const [learners, setLearners] = useState<TeacherLearnerDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 필터
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<number | "ALL">("ALL");

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const res = await repo.listLearners();
      if (isSuccessResponse(res)) {
        setLearners(res.data.items);
      }
      setIsLoading(false);
    }
    loadData();
  }, [repo]);

  const filtered = useMemo(() => {
    return learners.filter((l) => {
      if (gradeFilter !== "ALL" && l.gradeLevel !== gradeFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = l.name.toLowerCase().includes(q);
        const matchLogin = l.loginId.toLowerCase().includes(q);
        if (!matchName && !matchLogin) return false;
      }
      return true;
    });
  }, [learners, search, gradeFilter]);

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            담당 학생 관리
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            선생님께서 담당하시는 학생 목록 및 개별 맞춤 학습 설정을 관리합니다.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-full w-fit">
          총 {learners.length}명 관리 중
        </span>
      </div>

      {/* 검색 및 필터 바 */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="학생 이름 또는 로그인 ID로 검색"
            className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex gap-2 text-xs">
          <select
            value={gradeFilter}
            onChange={(e) =>
              setGradeFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
            }
            className="h-10 px-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <option value="ALL">전체 학년</option>
            <option value="1">중학교 1학년</option>
            <option value="2">중학교 2학년</option>
            <option value="3">중학교 3학년</option>
          </select>
        </div>
      </div>

      {/* 학생 목록 테이블 / 카드 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            학생 목록을 불러오고 있습니다...
          </div>
        ) : filtered.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((s) => (
              <Link
                key={s.learnerId}
                to="/teacher/students/$learnerId"
                params={{ learnerId: s.learnerId }}
                className="block hover:bg-slate-50 transition-colors p-4 group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-700 font-bold text-sm rounded-full flex items-center justify-center shrink-0">
                      {s.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600">
                          {s.name}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {s.loginId}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-700 font-medium rounded">
                          중{s.gradeLevel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        최근 제출: {s.recentCases?.length ?? 0}건 · 취약 개념:{" "}
                        <strong className="text-red-600">
                          {s.repeatedConcepts?.length ?? 0}개
                        </strong>
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-blue-600 font-medium group-hover:translate-x-0.5 transition-transform">
                    학습 관리 및 이력 →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400">
            검색 조건에 맞는 학생이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
