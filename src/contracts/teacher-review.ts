/**
 * 교사 검수 및 지도 관리 관련 계약 및 스키마
 * contracts/teacher-review.ts
 */

import { z } from "zod";
import type { Verdict, ErrorType, ConceptId } from "./domain";

export const VerdictEnum = z.enum(["CORRECT", "INCORRECT", "UNREADABLE", "UNDETERMINED"]);

export const ErrorTypeEnum = z.enum([
  "UNKNOWN",
  "ARITHMETIC",
  "SIGN",
  "EQUALITY_TRANSFORM",
  "DISTRIBUTION",
  "FRACTION_OPERATION",
  "DOMAIN_CONDITION",
  "PROBLEM_INTERPRETATION",
  "LOGICAL_GAP",
]);

export const ConceptIdEnum = z.enum([
  "M1_EQ_BALANCE",
  "M1_EQ_TRANSPOSE",
  "M1_DISTRIBUTION",
  "M1_RATIONAL_COEFFICIENT",
  "M1_EQ_BOTH_SIDES",
  "UNKNOWN",
]);

export type TeacherReviewActionType =
  | "CONFIRM_ONLY" // AI 판정 그대로 확인 후 공개
  | "SAVE_CORRECTION" // 판정/오류/힌트 수정 저장
  | "CLOSE_TEACHER" // 직접 지도 완료(TEACHER_CLOSED)
  | "GRANT_EXTRA_ATTEMPT"; // 추가 재풀이 1회 허용

export interface TeacherReviewFormData {
  verdict: "CORRECT" | "INCORRECT" | "UNREADABLE" | "UNDETERMINED";
  firstErrorLineId: string | null;
  errorType: z.infer<typeof ErrorTypeEnum> | null;
  conceptId: z.infer<typeof ConceptIdEnum> | null;
  studentNotice: string; // 공개 학생 안내 (≤ 300자)
  hints: string[]; // H1, H2, H3 (각 ≤ 300자)
  requiresExplanation: boolean; // 추가 설명 필요 여부
  correctionReason: string; // 수정 사유 (10~500자, 수정 시 필수)
  closeReason?: string | undefined; // 직접 지도 종결 설명 (20~1000자)
  extraAttemptReason?: string | undefined; // 추가 기회 부여 사유 (10~300자)
  errorBbox: { x: number; y: number; w: number; h: number } | null;
}

export const teacherReviewSchema = z
  .object({
    verdict: VerdictEnum,
    firstErrorLineId: z.string().nullable(),
    errorType: ErrorTypeEnum.nullable(),
    conceptId: ConceptIdEnum.nullable(),
    studentNotice: z.string().max(300, "공개 안내는 최대 300자까지 작성할 수 있습니다."),
    hints: z.array(z.string().max(300, "힌트는 각 최대 300자까지 작성할 수 있습니다.")).max(3),
    requiresExplanation: z.boolean(),
    correctionReason: z.string(),
    closeReason: z.string().optional(),
    extraAttemptReason: z.string().optional(),
    errorBbox: z
      .object({
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        w: z.number().min(0).max(1),
        h: z.number().min(0).max(1),
      })
      .nullable(),
  })
  .superRefine((data, ctx) => {
    // 오답 판정 시 최초 오류 줄과 오류 유형 필수
    if (data.verdict === "INCORRECT") {
      if (!data.firstErrorLineId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "오답으로 판정할 경우 최초 오류 줄 번호를 선택해야 합니다.",
          path: ["firstErrorLineId"],
        });
      }
      if (!data.errorType || data.errorType === "UNKNOWN") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "오답으로 판정할 경우 오류 유형을 지정해야 합니다.",
          path: ["errorType"],
        });
      }
    }
  });
