import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { FormField } from "../../components/app/FormField";
import {
  validateCorrectionReason,
  validateCloseReason,
  validateExtraAttemptReason,
  canGrantExtraAttempt,
} from "../../domain/teacher-review-policy";
import type { TeacherCaseDto } from "../../contracts/dto";
import type { Verdict, ErrorType, ConceptId } from "../../contracts/domain";

interface DiagnosisReviewFormProps {
  caseData: TeacherCaseDto;
  onConfirmOnly: () => Promise<void>;
  onSaveCorrection: (data: {
    verdict: Verdict;
    firstErrorLineId: string | null;
    errorType: ErrorType | undefined;
    conceptId: ConceptId | undefined;
    studentMessage: string;
    hints: string[];
    correctionReason: string;
    errorBbox: { x: number; y: number; w: number; h: number } | null;
  }) => Promise<void>;
  onCloseTeacher: (closeReason: string) => Promise<void>;
  onGrantExtraAttempt: (reason: string) => Promise<void>;
  isSubmitting: boolean;
}

export function DiagnosisReviewForm({
  caseData,
  onConfirmOnly,
  onSaveCorrection,
  onCloseTeacher,
  onGrantExtraAttempt,
  isSubmitting,
}: DiagnosisReviewFormProps) {
  // 폼 상태
  const [verdict, setVerdict] = useState<Verdict>(caseData.verdict);
  const [firstErrorLineId, setFirstErrorLineId] = useState<string | null>(
    caseData.errorRegion?.lineId ?? "L02",
  );
  const [errorType, setErrorType] = useState<ErrorType | undefined>(caseData.errorType ?? "SIGN");
  const [conceptId, setConceptId] = useState<ConceptId | undefined>(
    caseData.conceptId ?? "M1_EQ_TRANSPOSE",
  );
  const [studentMessage, setStudentMessage] = useState(caseData.studentMessage);
  const [hints, setHints] = useState<string[]>([
    caseData.allHints[0] ?? "이항할 때 부호에 주의하세요.",
    caseData.allHints[1] ?? "양변을 x의 계수로 나누어 해를 구하세요.",
    caseData.allHints[2] ?? "최종 해의 값을 다시 식에 대입하여 검산해 보세요.",
  ]);
  const [correctionReason, setCorrectionReason] = useState("");

  // 추가 다이얼로그/입력 모드
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState("");

  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraReason, setExtraReason] = useState("");

  const [validationError, setValidationError] = useState<string | null>(null);

  // 수정 저장 핸들러
  const handleSaveCorrectionSubmit = async () => {
    setValidationError(null);

    // 오답 검증
    if (verdict === "INCORRECT") {
      if (!firstErrorLineId) {
        setValidationError("오답 판정 시 최초 오류 발생 줄을 선택해야 합니다.");
        return;
      }
      if (!errorType || errorType === "UNKNOWN") {
        setValidationError("오답 판정 시 오류 유형을 선택해야 합니다.");
        return;
      }
    }

    // 수정 사유 검증 (10~500자)
    const reasonCheck = validateCorrectionReason(correctionReason);
    if (!reasonCheck.valid) {
      setValidationError(reasonCheck.error || "수정 사유가 올바르지 않습니다.");
      return;
    }

    try {
      await onSaveCorrection({
        verdict,
        firstErrorLineId: verdict === "INCORRECT" ? firstErrorLineId : null,
        errorType: verdict === "INCORRECT" ? errorType : undefined,
        conceptId: verdict === "INCORRECT" ? conceptId : undefined,
        studentMessage: studentMessage.trim(),
        hints: hints.map((h) => h.trim()),
        correctionReason: correctionReason.trim(),
        errorBbox: caseData.errorRegion?.bbox ?? null,
      });
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : "저장 중 오류 발생");
    }
  };

  // 직접 지도 종결 핸들러
  const handleCloseTeacherSubmit = async () => {
    const check = validateCloseReason(closeReason);
    if (!check.valid) {
      alert(check.error);
      return;
    }
    try {
      await onCloseTeacher(closeReason.trim());
      setShowCloseModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "종결 처리 중 오류");
    }
  };

  // 추가 재풀이 허용 핸들러
  const handleGrantExtraSubmit = async () => {
    const check = validateExtraAttemptReason(extraReason);
    if (!check.valid) {
      alert(check.error);
      return;
    }
    try {
      await onGrantExtraAttempt(extraReason.trim());
      setShowExtraModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "기회 부여 중 오류");
    }
  };

  const isEligibleForExtra = canGrantExtraAttempt(
    caseData.evaluatedCount,
    caseData.maxEvaluatedCount,
    caseData.extraAttemptAllowance,
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6">
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">교사 진단 검수 및 피드백 폼</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            AI의 자동 판정 결과를 확인하고 필요 시 수정하여 학생에게 공개합니다.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full">
          v{caseData.resultVersion} 결과 검수
        </span>
      </div>

      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          ⚠️ {validationError}
        </div>
      )}

      {/* 1. 판정 라디오 */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800">
          최종 진단 판정 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            {
              value: "CORRECT",
              label: "정답 (CORRECT)",
              color: "text-emerald-700 border-emerald-300",
            },
            {
              value: "INCORRECT",
              label: "오답 (INCORRECT)",
              color: "text-blue-700 border-blue-300",
            },
            { value: "UNREADABLE", label: "판독 불가", color: "text-amber-700 border-amber-300" },
            { value: "UNDETERMINED", label: "확인 필요", color: "text-slate-700 border-slate-300" },
          ].map((v) => (
            <label
              key={v.value}
              className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-2 transition-all ${
                verdict === v.value
                  ? "bg-blue-50/80 border-blue-600 ring-2 ring-blue-600 text-blue-900"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <input
                type="radio"
                name="verdict"
                value={v.value}
                checked={verdict === v.value}
                onChange={() => setVerdict(v.value as Verdict)}
                className="w-4 h-4 text-blue-600"
              />
              <span>{v.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 2. 오답일 때 세부 오류 설정 */}
      {verdict === "INCORRECT" && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
          <h4 className="text-xs font-bold text-slate-800">오류 세부 분석</h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 최초 오류 줄 */}
            <div>
              <label
                htmlFor="error-line"
                className="block text-[11px] font-semibold text-slate-700 mb-1"
              >
                최초 오류 발생 줄 <span className="text-red-500">*</span>
              </label>
              <select
                id="error-line"
                value={firstErrorLineId ?? ""}
                onChange={(e) => setFirstErrorLineId(e.target.value || null)}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="">줄 선택</option>
                {caseData.recognizedLines.map((l) => (
                  <option key={l.lineId} value={l.lineId}>
                    {l.lineId} ({l.text})
                  </option>
                ))}
              </select>
            </div>

            {/* 오류 유형 */}
            <div>
              <label
                htmlFor="error-type"
                className="block text-[11px] font-semibold text-slate-700 mb-1"
              >
                오류 유형 <span className="text-red-500">*</span>
              </label>
              <select
                id="error-type"
                value={errorType ?? "SIGN"}
                onChange={(e) => setErrorType(e.target.value as ErrorType)}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="SIGN">부호 오류 (SIGN)</option>
                <option value="ARITHMETIC">단순 연산 실수 (ARITHMETIC)</option>
                <option value="EQUALITY_TRANSFORM">등식의 성질 오적용 (EQUALITY_TRANSFORM)</option>
                <option value="DISTRIBUTION">분배법칙 오류 (DISTRIBUTION)</option>
                <option value="FRACTION_OPERATION">분수/계수 계산 오류</option>
                <option value="PROBLEM_INTERPRETATION">문제 오독</option>
                <option value="LOGICAL_GAP">풀이 비약/누락</option>
              </select>
            </div>

            {/* 핵심 개념 */}
            <div>
              <label
                htmlFor="concept-id"
                className="block text-[11px] font-semibold text-slate-700 mb-1"
              >
                취약 단원 개념 <span className="text-red-500">*</span>
              </label>
              <select
                id="concept-id"
                value={conceptId ?? "M1_EQ_TRANSPOSE"}
                onChange={(e) => setConceptId(e.target.value as ConceptId)}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="M1_EQ_TRANSPOSE">이항 (M1_EQ_TRANSPOSE)</option>
                <option value="M1_EQ_BALANCE">등식의 성질 (M1_EQ_BALANCE)</option>
                <option value="M1_DISTRIBUTION">분배법칙 (M1_DISTRIBUTION)</option>
                <option value="M1_RATIONAL_COEFFICIENT">계수 정리 (M1_RATIONAL_COEFFICIENT)</option>
                <option value="M1_EQ_BOTH_SIDES">양변 정리 및 풀이</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 3. 학생 공개 피드백 문구 */}
      <div className="space-y-1.5">
        <label htmlFor="student-notice" className="block text-xs font-bold text-slate-800">
          학생 공개 진단 안내문 (최대 300자)
        </label>
        <textarea
          id="student-notice"
          rows={2}
          maxLength={300}
          value={studentMessage}
          onChange={(e) => setStudentMessage(e.target.value)}
          className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none"
          placeholder="학생에게 보여줄 핵심 조언을 작성하세요"
        />
        <div className="text-right text-[11px] text-slate-400">{studentMessage.length} / 300자</div>
      </div>

      {/* 4. 단계별 힌트 편집 (오답일 때) */}
      {verdict === "INCORRECT" && (
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-800">
            단계별 맞춤 힌트 편집 (각 최대 300자)
          </label>
          {hints.map((h, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1.5 rounded shrink-0">
                H{i + 1}
              </span>
              <input
                type="text"
                maxLength={300}
                value={h}
                onChange={(e) => {
                  const next = [...hints];
                  next[i] = e.target.value;
                  setHints(next);
                }}
                className="flex-1 h-9 px-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder={`${i + 1}단계 힌트 내용`}
              />
            </div>
          ))}
        </div>
      )}

      {/* 5. 수정 사유 입력 (수정 저장 시 필수, 10~500자) */}
      <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-1.5">
        <label htmlFor="correction-reason" className="block text-xs font-bold text-blue-900">
          판정 수정 사유 <span className="text-red-500">*</span>
          <span className="font-normal text-slate-500 ml-1">
            (감사 이력에 영구 보존됨, 10~500자)
          </span>
        </label>
        <textarea
          id="correction-reason"
          rows={2}
          maxLength={500}
          value={correctionReason}
          onChange={(e) => setCorrectionReason(e.target.value)}
          placeholder="예: AI가 부호 오류로 오인하였으나 실제로는 이항 누락에 해당하여 개념 및 힌트를 수정함."
          className="w-full p-2.5 text-xs bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none"
        />
        <div className="text-right text-[11px] text-slate-400">
          {correctionReason.length} / 500자 (최소 10자)
        </div>
      </div>

      {/* 6. 액션 버튼 바 */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
        <div className="flex items-center gap-2">
          {/* 확인만 저장 */}
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onConfirmOnly}
            className="h-11 px-4 text-xs font-semibold text-slate-700"
          >
            변경 없이 확인만 저장
          </Button>

          {/* 수정 사항 저장 */}
          <Button
            type="button"
            disabled={isSubmitting || correctionReason.trim().length < 10}
            onClick={handleSaveCorrectionSubmit}
            className="h-11 px-5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
          >
            {isSubmitting ? "저장 중..." : "수정 내용 확정 및 학생 공개"}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* 직접 지도 완료 */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCloseModal(true)}
            className="h-11 px-3 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          >
            직접 지도 완료 종결
          </Button>

          {/* 추가 재풀이 기회 부여 */}
          {isEligibleForExtra && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowExtraModal(true)}
              className="h-11 px-3 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              재풀이 기회 +1 부여
            </Button>
          )}
        </div>
      </div>

      {/* 모달: 직접 지도 종결 */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4">
            <h4 className="text-base font-bold text-slate-900">직접 지도 완료(TEACHER_CLOSED)</h4>
            <p className="text-xs text-slate-500">
              교실에서 학생을 직접 지도하여 문제를 종결합니다. 지도한 내용을 상세히 기록해 주세요.
              (20~1000자)
            </p>
            <textarea
              rows={4}
              maxLength={1000}
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              placeholder="예: 학생과 개별 면담을 진행하여 이항 시 부호 변경 원리를 직접 지도하였고, 유사 문제를 풀어보게 하여 완전히 이해했음을 확인했습니다."
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            <div className="text-right text-[11px] text-slate-400">
              {closeReason.length} / 1000자 (최소 20자)
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowCloseModal(false)}>
                취소
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={closeReason.trim().length < 20}
                onClick={handleCloseTeacherSubmit}
              >
                지도 완료 종결하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 모달: 추가 재풀이 기회 부여 */}
      {showExtraModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-4">
            <h4 className="text-base font-bold text-slate-900">추가 재풀이 기회 1회 부여</h4>
            <p className="text-xs text-slate-500">
              평가 한도에 도달한 학생에게 1회의 추가 재풀이 기회를 부여합니다. (사유 10~300자)
            </p>
            <textarea
              rows={3}
              maxLength={300}
              value={extraReason}
              onChange={(e) => setExtraReason(e.target.value)}
              placeholder="예: 학생이 힌트를 바탕으로 개념을 복습한 뒤 다시 시도해 보기를 강력히 희망하여 기회를 부여함."
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            <div className="text-right text-[11px] text-slate-400">
              {extraReason.length} / 300자 (최소 10자)
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowExtraModal(false)}>
                취소
              </Button>
              <Button
                size="sm"
                className="bg-amber-600 text-white hover:bg-amber-700"
                disabled={extraReason.trim().length < 10}
                onClick={handleGrantExtraSubmit}
              >
                추가 기회 부여 확정
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
