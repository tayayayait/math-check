import React from "react";
import { FormField } from "../../components/app/FormField";
import { DEMO_TAXONOMY, type UnitDefinition } from "../../data/demo/taxonomy";

export interface ProblemMetadataState {
  gradeLevel: number;
  unitId: string;
  bookTitle: string;
  page: number | "";
  problemNo: string;
}

interface ProblemMetadataFormProps {
  metadata: ProblemMetadataState;
  onChange: (updated: ProblemMetadataState) => void;
  errors?: Partial<Record<keyof ProblemMetadataState, string>>;
}

export function ProblemMetadataForm({ metadata, onChange, errors = {} }: ProblemMetadataFormProps) {
  // 현재 학년 라벨 구하기
  const getGradeLabel = (grade: number): string => {
    if (grade >= 1 && grade <= 6) return `초등학교 ${grade}학년`;
    if (grade >= 7 && grade <= 9) return `중학교 ${grade - 6}학년`;
    if (grade >= 10 && grade <= 12) return `고등학교 ${grade - 9}학년`;
    return `${grade}학년`;
  };

  // 해당 학년 단원 목록 (또는 전체 데모 단원)
  const availableUnits = DEMO_TAXONOMY;

  return (
    <div className="space-y-5 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">문제 메타 정보 입력</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            제출하는 수학 문제의 교재명과 위치를 정확히 입력해 주세요.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-medium text-slate-400 block">설정 학년</span>
          <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
            {getGradeLabel(metadata.gradeLevel)}
          </span>
        </div>
      </div>

      {/* 단원 선택 */}
      <div>
        <label htmlFor="unit-select" className="block text-sm font-semibold text-slate-800 mb-1.5">
          학습 단원 선택 <span className="text-xs font-normal text-slate-400">(선택 사항)</span>
        </label>
        <select
          id="unit-select"
          value={metadata.unitId}
          onChange={(e) => onChange({ ...metadata, unitId: e.target.value })}
          className="w-full h-11 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
        >
          <option value="">단원 직접 선택 안 함 (자동 진단)</option>
          {availableUnits.map((u) => (
            <option key={u.unitId} value={u.unitId}>
              {u.title}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-500 mt-1">
          * 단원을 선택하지 않으셔도 정상 접수되며, AI가 문제 내용을 바탕으로 자동 분류합니다.
        </p>
      </div>

      {/* 교재명 */}
      <FormField
        label="교재명"
        id="book-title"
        required
        error={errors.bookTitle}
        hint="예: 쎈 중등 수학 1-1, 개념원리, RPM, 교과서 등 (최대 60자)"
        type="text"
        maxLength={60}
        value={metadata.bookTitle}
        onChange={(e) => onChange({ ...metadata, bookTitle: e.target.value })}
        placeholder="교재 이름을 입력하세요"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 페이지 */}
        <FormField
          label="페이지(쪽)"
          id="page-num"
          required
          error={errors.page}
          hint="1 ~ 2000 사이의 숫자"
          type="number"
          min={1}
          max={2000}
          value={metadata.page === "" ? "" : metadata.page}
          onChange={(e) => {
            const val = e.target.value === "" ? "" : parseInt(e.target.value, 10);
            onChange({ ...metadata, page: val });
          }}
          placeholder="예: 45"
        />

        {/* 문제 번호 */}
        <FormField
          label="문제 번호"
          id="problem-no"
          required
          error={errors.problemNo}
          hint="예: 12, 12-1, 유제 3 (최대 20자)"
          type="text"
          maxLength={20}
          value={metadata.problemNo}
          onChange={(e) => onChange({ ...metadata, problemNo: e.target.value })}
          placeholder="예: 12"
        />
      </div>
    </div>
  );
}
