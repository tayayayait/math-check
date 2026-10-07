/**
 * 원장/관리자 운영 설정 계약 및 스키마
 * contracts/admin.ts
 */

import { z } from "zod";
import type { Role, AccountStatus } from "./domain";

export type ConsentType = "CORE_LEARNING" | "EXTERNAL_AI" | "PARENT_REPORT";
export type ConsentVerificationMethod = "SIGNED_FORM" | "VERIFIED_PARENT_ACCOUNT";

export interface ConsentRecordDto {
  consentId: string;
  learnerId: string;
  learnerName: string;
  isUnder14: boolean;
  legalGuardianName?: string;
  coreLearningConsent: boolean;
  externalAiConsent: boolean;
  parentReportConsent: boolean;
  verificationMethod: ConsentVerificationMethod;
  consentVersion: string;
  agreedAt: string;
  proofStatus: "VERIFIED" | "PENDING_PROOF" | "REJECTED";
}

export type DeletionRequestStatus = "REQUESTED" | "BLOCKED" | "PURGING" | "FAILED" | "COMPLETED";

export interface DeletionRequestDto {
  requestId: string;
  actorId: string;
  actorName: string;
  role: Role;
  reason: string;
  status: DeletionRequestStatus;
  requestedAt: string;
  processedAt?: string;
  failureReason?: string;
}

export interface AiOperationConfigDto {
  aiReleaseEnabled: boolean;
  monthlyBudgetKrw: number;
  currentMonthSpentKrw: number;
  totalDiagnosisCalls: number;
  activeModelName: string;
  promptVersion: string;
  supportedUnits: Array<{
    unitId: string;
    unitName: string;
    status: "AUTO_ENABLED" | "MANUAL_ONLY";
  }>;
}

export type CorrectionRuleStatus = "DRAFT" | "APPROVED" | "ACTIVE" | "RETIRED";

export interface CorrectionRuleDto {
  ruleId: string;
  ruleTitle: string;
  conceptId: string;
  errorType: string;
  appliesWhen: string;
  correctionPrinciple: string;
  counterExamples: string[];
  syntheticExamples: string[];
  version: number;
  status: CorrectionRuleStatus;
  privacyCheckPassed: boolean;
  regressionEvalStatus: "PASS" | "FAIL" | "PENDING";
  createdAt: string;
  updatedAt: string;
}

// Zod 검증 스키마
export const createAccountSchema = z.object({
  role: z.enum(["STUDENT", "TEACHER", "PARENT"]),
  name: z
    .string()
    .trim()
    .min(1, "성명은 1자 이상이어야 합니다.")
    .max(30, "성명은 최대 30자까지 가능합니다."),
  internalNo: z
    .string()
    .trim()
    .min(1, "관리번호는 1자 이상이어야 합니다.")
    .max(20, "관리번호는 20자 이하이어야 합니다.")
    .regex(/^[A-Za-z0-9-]+$/, "관리번호는 영문, 숫자, 하이픈(-)만 사용할 수 있습니다."),
  gradeLevel: z.number().int().min(1).max(12).optional(),
});
export type CreateAccountInput = z.infer<typeof createAccountSchema>;

export const updateAccountStatusSchema = z.object({
  actorId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
  reason: z.string().trim().min(5, "사유는 최소 5자 이상 작성해야 합니다.").max(200),
});
export type UpdateAccountStatusInput = z.infer<typeof updateAccountStatusSchema>;

export const assignRelationsSchema = z.object({
  learnerId: z.string().min(1),
  teacherIds: z.array(z.string()).max(4, "학생당 담당 교사는 최대 4명까지 배정 가능합니다."),
  parentIds: z.array(z.string()).max(2, "학생당 보호자 계정은 최대 2명까지 연결 가능합니다."),
});
export type AssignRelationsInput = z.infer<typeof assignRelationsSchema>;

export const createCorrectionRuleSchema = z.object({
  ruleTitle: z.string().trim().min(2, "규칙 제목은 최소 2자 이상입니다.").max(100),
  conceptId: z.string().min(1, "개념 ID를 선택해 주세요."),
  errorType: z.string().min(1, "오류 유형을 선택해 주세요."),
  appliesWhen: z
    .string()
    .trim()
    .min(10, "적용 조건은 10자 이상 구체적으로 작성해 주세요.")
    .max(500),
  correctionPrinciple: z.string().trim().min(10, "교정 원리는 10자 이상 작성해 주세요.").max(500),
  counterExamples: z
    .array(z.string().trim().min(5).max(500))
    .min(1, "반례는 최소 1개 이상 필요합니다.")
    .max(3, "반례는 최대 3개까지 등록 가능합니다."),
});
export type CreateCorrectionRuleInput = z.infer<typeof createCorrectionRuleSchema>;
