/**
 * 복습 문제 관리 관련 계약 및 스키마
 * contracts/review-item.ts
 */

import { z } from "zod";
import type { ConceptId, ReviewItemStatus } from "./domain";

export interface ReviewItemChecklist {
  /** 1. 문제 조건이 충분한가 */
  sufficientConditions: boolean;
  /** 2. 단일 해가 존재하고 유일한가 */
  solutionExistenceAndUniqueness: boolean;
  /** 3. 독립 검증 답안과 정답이 일치하는가 */
  independentAnswerMatch: boolean;
  /** 4. 현재 교육과정(중1 1학기 일차방정식) 학년/단원과 일치하는가 */
  gradeAndUnitMatch: boolean;
  /** 5. 학생이 틀린 오류 개념을 효과적으로 훈련할 수 있는가 */
  errorConceptTargeting: boolean;
  /** 6. 아직 배우지 않은 상위 개념(연립방정식, 이차방정식 등)이 없는가 */
  noUnlearnedConcepts: boolean;
  /** 7. 지문이나 보기 안에 정답이 노출되는 결함이 없는가 */
  noAnswerLeakage: boolean;
  /** 8. 모바일 화면(폭 360px)에서 수식이 깨짐 없이 선명하게 읽히는가 */
  mobileMathLegibility: boolean;
}

export const DEFAULT_REVIEW_CHECKLIST: ReviewItemChecklist = {
  sufficientConditions: true,
  solutionExistenceAndUniqueness: true,
  independentAnswerMatch: true,
  gradeAndUnitMatch: true,
  errorConceptTargeting: true,
  noUnlearnedConcepts: true,
  noAnswerLeakage: true,
  mobileMathLegibility: true,
};

export const CHECKLIST_DESCRIPTIONS: Record<
  keyof ReviewItemChecklist,
  { title: string; description: string }
> = {
  sufficientConditions: {
    title: "문제 조건 충분성",
    description: "방정식을 풀기에 필요한 조건과 미지수 정의가 누락 없이 완전합니다.",
  },
  solutionExistenceAndUniqueness: {
    title: "해의 존재 및 유일성",
    description: "항등식이나 불능식이 아니며, 단 하나의 해가 명확하게 존재합니다.",
  },
  independentAnswerMatch: {
    title: "독립 검증 답안 일치",
    description: "시스템 독립 풀이 엔진 및 교사 계산 결과와 정답이 일치합니다.",
  },
  gradeAndUnitMatch: {
    title: "학년 및 단원 부합",
    description: "중학교 1학년 일차방정식 단원 범위에 정확히 부합합니다.",
  },
  errorConceptTargeting: {
    title: "오류 개념 집중 훈련",
    description: "학생이 오답을 낸 취약 개념(이항, 부호, 분배 등)을 집중 연습할 수 있습니다.",
  },
  noUnlearnedConcepts: {
    title: "미학습 개념 미포함",
    description: "아직 학습하지 않은 고난도 개념이나 상위 학년 테크닉이 포함되어 있지 않습니다.",
  },
  noAnswerLeakage: {
    title: "정답 누출 없음",
    description: "문제 지문이나 힌트성 서술에 정답이 미리 유출되지 않았습니다.",
  },
  mobileMathLegibility: {
    title: "모바일 수식 가독성",
    description: "모바일 화면(폭 360px)에서 KaTeX 수식 줄바꿈 및 가독성이 양호합니다.",
  },
};

export interface ReviewItemDetailDto {
  reviewId: string;
  sourceCaseId: string;
  learnerId: string;
  learnerName: string;
  questionVersion: number;
  status: ReviewItemStatus;
  problemText: string;
  conceptId: ConceptId;
  difficulty: "BASIC" | "STANDARD";
  validationStatus: "PASS" | "FAIL" | "PENDING";
  expectedAnswer?: string | undefined;
  independentVerification?: string | undefined;
  originalProblemText?: string | undefined;
  originalErrorConceptId?: ConceptId | undefined;
  rejectionReason?: string | undefined;
  completionReason?: "CORRECT" | "TEACHER_CLOSED" | undefined;
  checklist: ReviewItemChecklist;
  createdAt: string;
  updatedAt: string;
}

export const editReviewCandidateSchema = z.object({
  reviewId: z.string().min(1),
  expectedVersion: z.number().int().min(1),
  problemText: z
    .string()
    .trim()
    .min(5, "문제 본문은 최소 5자 이상 입력해야 합니다.")
    .max(800, "문제 본문은 최대 800자까지 작성할 수 있습니다."),
  difficulty: z.enum(["BASIC", "STANDARD"]),
});
export type EditReviewCandidateInput = z.infer<typeof editReviewCandidateSchema>;

export const approveReviewSchema = z.object({
  reviewId: z.string().min(1),
  expectedVersion: z.number().int().min(1),
  checklist: z.object({
    sufficientConditions: z.literal(true),
    solutionExistenceAndUniqueness: z.literal(true),
    independentAnswerMatch: z.literal(true),
    gradeAndUnitMatch: z.literal(true),
    errorConceptTargeting: z.literal(true),
    noUnlearnedConcepts: z.literal(true),
    noAnswerLeakage: z.literal(true),
    mobileMathLegibility: z.literal(true),
  }),
  idempotencyKey: z.string().min(1),
});
export type ApproveReviewInput = z.infer<typeof approveReviewSchema>;

export const rejectReviewSchema = z.object({
  reviewId: z.string().min(1),
  expectedVersion: z.number().int().min(1),
  reason: z
    .string()
    .trim()
    .min(10, "반려 사유는 최소 10자 이상 입력해야 합니다.")
    .max(500, "반려 사유는 최대 500자까지 입력할 수 있습니다."),
  idempotencyKey: z.string().min(1),
});
export type RejectReviewInput = z.infer<typeof rejectReviewSchema>;
