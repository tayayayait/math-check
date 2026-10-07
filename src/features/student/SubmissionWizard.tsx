import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { useAppRepository } from "../../services/data-provider";
import { useDemoSession } from "../auth/DemoSessionProvider";
import { PhotoPicker, type PhotoDraftItem } from "./PhotoPicker";
import { ProblemMetadataForm, type ProblemMetadataState } from "./ProblemMetadataForm";
import { SubmissionConfirm } from "./SubmissionConfirm";
import { isSuccessResponse } from "../../contracts/errors";
import type { StudentCaseListItemDto } from "../../contracts/dto";
import type { PhotoRef } from "../../contracts/domain";

export function SubmissionWizard() {
  const navigate = useNavigate();
  const repo = useAppRepository();
  const { session } = useDemoSession();

  // 위저드 현재 단계: 1 | 2 | 3
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: 사진 상태
  const [problemPhoto, setProblemPhoto] = useState<PhotoDraftItem | null>(null);
  const [workPhotos, setWorkPhotos] = useState<PhotoDraftItem[]>([]);

  // Step 2: 메타데이터 상태 (학생 세션 기본 학년 7 = 중1)
  const [metadata, setMetadata] = useState<ProblemMetadataState>({
    gradeLevel: 7,
    unitId: "M1_LINEAR_EQUATIONS",
    bookTitle: "개념원리 중학수학 1-1",
    page: 48,
    problemNo: "12",
  });
  const [metadataErrors, setMetadataErrors] = useState<
    Partial<Record<keyof ProblemMetadataState, string>>
  >({});

  // Step 3: 확인 체크박스
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [legibilityChecked, setLegibilityChecked] = useState(false);

  // 제출 진행 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 24시간 중복 감지 다이얼로그 상태
  const [duplicateWarning, setDuplicateWarning] = useState<{
    isOpen: boolean;
    existingCaseId: string;
  }>({
    isOpen: false,
    existingCaseId: "",
  });

  // 사진이 변경되면 Step 3의 확인 체크박스를 초기화
  const handleProblemPhotoChange = (photo: PhotoDraftItem | null) => {
    setProblemPhoto(photo);
    setPrivacyChecked(false);
    setLegibilityChecked(false);
  };

  const handleWorkPhotosChange = (photos: PhotoDraftItem[]) => {
    setWorkPhotos(photos);
    setPrivacyChecked(false);
    setLegibilityChecked(false);
  };

  // Step 1 유효성 검사 (문제 1장, 풀이 1~3장)
  const canGoToStep2 = problemPhoto !== null && workPhotos.length >= 1 && workPhotos.length <= 3;

  // Step 2 유효성 검사
  const validateStep2 = (): boolean => {
    const errors: Partial<Record<keyof ProblemMetadataState, string>> = {};
    if (!metadata.bookTitle.trim()) {
      errors.bookTitle = "교재명을 입력해 주세요.";
    } else if (metadata.bookTitle.length > 60) {
      errors.bookTitle = "교재명은 최대 60자까지 입력할 수 있습니다.";
    }

    if (metadata.page === "" || isNaN(Number(metadata.page))) {
      errors.page = "페이지 번호를 입력해 주세요.";
    } else if (Number(metadata.page) < 1 || Number(metadata.page) > 2000) {
      errors.page = "페이지는 1에서 2000 사이의 숫자여야 합니다.";
    }

    if (!metadata.problemNo.trim()) {
      errors.problemNo = "문제 번호를 입력해 주세요.";
    } else if (metadata.problemNo.length > 20) {
      errors.problemNo = "문제 번호는 최대 20자까지 입력할 수 있습니다.";
    }

    setMetadataErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 2로 이동
  const handleNextToStep2 = () => {
    if (!canGoToStep2) return;
    setErrorMessage(null);
    setCurrentStep(2);
  };

  // Step 3으로 이동 전 24시간 내 동일 문제 중복 검사
  const handleNextToStep3 = async () => {
    if (!validateStep2()) return;
    setErrorMessage(null);

    // 저장소의 최근 케이스와 동일 교재/페이지/번호 확인
    const casesRes = await repo.listCases({ pageSize: 20 });
    if (isSuccessResponse(casesRes)) {
      const existing = casesRes.data.items.find(
        (c: StudentCaseListItemDto) =>
          c.bookTitle === metadata.bookTitle.trim() &&
          c.page === Number(metadata.page) &&
          c.problemNo === metadata.problemNo.trim(),
      );

      if (existing) {
        setDuplicateWarning({
          isOpen: true,
          existingCaseId: existing.caseId,
        });
        return;
      }
    }

    setCurrentStep(3);
  };

  // 최종 제출 처리
  const handleSubmit = async () => {
    if (!problemPhoto || workPhotos.length === 0) return;
    if (!privacyChecked || !legibilityChecked) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const problemPhotoRef: PhotoRef = {
        clientPhotoId: problemPhoto.id,
        purpose: "PROBLEM",
        order: 0,
        width: problemPhoto.width,
        height: problemPhoto.height,
        mime: problemPhoto.mime,
        bytes: problemPhoto.bytes,
        editedRevision: problemPhoto.editedRevision,
      };

      const workPhotoRefs: PhotoRef[] = workPhotos.map((w, idx) => ({
        clientPhotoId: w.id,
        purpose: "WORK",
        order: idx + 1,
        width: w.width,
        height: w.height,
        mime: w.mime,
        bytes: w.bytes,
        editedRevision: w.editedRevision,
      }));

      const maxRevision = Math.max(
        problemPhoto.editedRevision,
        ...workPhotos.map((w) => w.editedRevision),
      );

      const idempotencyKey = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const res = await repo.createSubmission({
        bookTitle: metadata.bookTitle.trim(),
        page: Number(metadata.page),
        problemNo: metadata.problemNo.trim(),
        unitId: metadata.unitId || "M1_LINEAR_EQUATIONS",
        problemPhotoRef,
        workPhotoRefs,
        confirmedPhotoRevision: maxRevision,
        privacyChecked: true,
        legibilityChecked: true,
        idempotencyKey,
      });

      if (!isSuccessResponse(res)) {
        setErrorMessage(res.error.message || "제출 처리 중 오류가 발생했습니다.");
        setIsSubmitting(false);
        return;
      }

      // 성공 시 해당 케이스 상세 페이지로 이동
      navigate({ to: `/student/cases/${res.data.caseId}` });
    } catch (err) {
      setErrorMessage(
        "제출 중 오류가 발생했습니다: " + (err instanceof Error ? err.message : String(err)),
      );
      setIsSubmitting(false);
    }
  };

  // 새로고침 시 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (problemPhoto || workPhotos.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [problemPhoto, workPhotos]);

  return (
    <div className="space-y-6">
      {/* 스텝 인디케이터 */}
      <nav aria-label="제출 단계 진행 상황" className="pb-2">
        <ol className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <li
            className={`flex items-center gap-1.5 ${
              currentStep >= 1 ? "text-blue-600 font-bold" : ""
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep >= 1 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              1
            </span>
            <span>사진 등록 및 편집</span>
          </li>
          <div
            className={`flex-1 h-0.5 mx-2 ${currentStep >= 2 ? "bg-blue-600" : "bg-slate-200"}`}
          />
          <li
            className={`flex items-center gap-1.5 ${
              currentStep >= 2 ? "text-blue-600 font-bold" : ""
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep >= 2 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              2
            </span>
            <span>문제 정보</span>
          </li>
          <div
            className={`flex-1 h-0.5 mx-2 ${currentStep >= 3 ? "bg-blue-600" : "bg-slate-200"}`}
          />
          <li
            className={`flex items-center gap-1.5 ${
              currentStep >= 3 ? "text-blue-600 font-bold" : ""
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep >= 3 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              3
            </span>
            <span>확인 및 접수</span>
          </li>
        </ol>
      </nav>

      {/* 오류 안내 배너 */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between"
        >
          <span>⚠️ {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2 text-base"
          >
            ×
          </button>
        </div>
      )}

      {/* 단계별 화면 렌더링 */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <PhotoPicker
            problemPhoto={problemPhoto}
            workPhotos={workPhotos}
            onProblemPhotoChange={handleProblemPhotoChange}
            onWorkPhotosChange={handleWorkPhotosChange}
          />

          <div className="pt-3 flex justify-end">
            <Button
              type="button"
              disabled={!canGoToStep2}
              onClick={handleNextToStep2}
              className={`h-11 px-6 font-semibold rounded-xl text-white ${
                canGoToStep2
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-slate-300 cursor-not-allowed text-slate-500"
              }`}
            >
              다음: 문제 정보 입력 →
            </Button>
          </div>
          {!canGoToStep2 && (
            <p className="text-[11px] text-slate-400 text-right">
              * 문제 사진 1장과 풀이 사진 1장 이상을 등록해야 다음 단계로 갈 수 있습니다.
            </p>
          )}
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <ProblemMetadataForm
            metadata={metadata}
            onChange={(m) => setMetadata(m)}
            errors={metadataErrors}
          />

          <div className="pt-3 flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="h-11 px-5 rounded-xl font-medium"
            >
              ← 이전: 사진 수정
            </Button>
            <Button
              type="button"
              onClick={handleNextToStep3}
              className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
            >
              다음: 최종 확인 →
            </Button>
          </div>
        </div>
      )}

      {currentStep === 3 && problemPhoto && (
        <div className="space-y-6">
          <SubmissionConfirm
            problemPhoto={problemPhoto}
            workPhotos={workPhotos}
            metadata={metadata}
            privacyChecked={privacyChecked}
            legibilityChecked={legibilityChecked}
            onPrivacyCheckedChange={setPrivacyChecked}
            onLegibilityCheckedChange={setLegibilityChecked}
            onSubmit={handleSubmit}
            onBackToEdit={(step) => setCurrentStep(step)}
            isSubmitting={isSubmitting}
          />

          <div className="pt-2 flex justify-start">
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => setCurrentStep(2)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              ← 문제 정보 단계로 돌아가기
            </Button>
          </div>
        </div>
      )}

      {/* 24시간 중복 의심 감지 다이얼로그 */}
      <Dialog
        open={duplicateWarning.isOpen}
        onOpenChange={(open) => !open && setDuplicateWarning({ isOpen: false, existingCaseId: "" })}
      >
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              이미 접수된 동일 문제 안내
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 pt-2 leading-relaxed">
              입력하신 교재명(<strong>{metadata.bookTitle}</strong>, {metadata.page}쪽 #
              {metadata.problemNo})은 최근 24시간 이내에 이미 진단받은 기록이 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-xs text-slate-700 space-y-1">
            <p>
              기존 진단 결과를 다시 확인하시겠습니까, 아니면 별도의 문제로 계속 제출하시겠습니까?
            </p>
          </div>
          <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const caseId = duplicateWarning.existingCaseId;
                setDuplicateWarning({ isOpen: false, existingCaseId: "" });
                navigate({ to: `/student/cases/${caseId}` });
              }}
              className="text-xs h-9 px-3"
            >
              기존 진단 결과 보기
            </Button>
            <Button
              type="button"
              onClick={() => {
                setDuplicateWarning({ isOpen: false, existingCaseId: "" });
                setCurrentStep(3);
              }}
              className="text-xs h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              새 문제로 계속 제출하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
