/**
 * 요청 입력 스키마 및 Zod 유효성 검증
 * contracts/inputs.ts
 */

import { z } from "zod";

export const photoRefSchema = z.object({
  clientPhotoId: z.string().min(1),
  purpose: z.enum(["PROBLEM", "WORK"]),
  order: z.number().int().min(0).max(10),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  mime: z.string().min(1),
  bytes: z.number().int().positive(),
  editedRevision: z.number().int().min(0),
});

export const boundingBoxSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    w: z.number().positive().max(1),
    h: z.number().positive().max(1),
  })
  .refine((b) => b.x + b.w <= 1 && b.y + b.h <= 1, {
    message: "오류 영역이 이미지 경계를 초과할 수 없습니다.",
  });

export const errorRegionSchema = z.object({
  lineId: z.string().nullable(),
  bbox: boundingBoxSchema.nullable(),
});

export const loginSchema = z
  .object({
    kind: z.enum(["STUDENT", "EMAIL"]),
    loginId: z.string().trim().optional(),
    email: z.string().trim().email().optional(),
    password: z.string().min(1, "비밀번호를 입력해 주세요."),
    remember: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.kind === "STUDENT") {
        return Boolean(data.loginId && /^s[a-z0-9]{8}$/i.test(data.loginId));
      }
      return Boolean(data.email && data.email.length <= 254);
    },
    {
      message: "아이디 또는 이메일 형식이 올바르지 않습니다.",
      path: ["loginId"],
    },
  );
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력해 주세요."),
    newPassword: z
      .string()
      .min(12, "비밀번호는 최소 12자리 이상이어야 합니다.")
      .max(64, "비밀번호는 최대 64자리까지 허용됩니다."),
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력해 주세요."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "새 비밀번호와 비밀번호 확인이 일치하지 않습니다.",
    path: ["confirmPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const createSubmissionSchema = z.object({
  bookTitle: z.string().trim().min(1, "교재명을 입력해 주세요.").max(100),
  page: z.number().int().min(1, "페이지는 1 이상이어야 합니다.").max(2000),
  problemNo: z.string().trim().min(1, "문제 번호를 입력해 주세요.").max(20),
  unitId: z.string().trim().optional(),
  problemPhotoRef: photoRefSchema,
  workPhotoRefs: z.array(photoRefSchema).min(1, "풀이 사진을 최소 1장 첨부해 주세요.").max(3),
  confirmedPhotoRevision: z.number().int().min(0),
  privacyChecked: z.literal(true, {
    errorMap: () => ({ message: "개인정보 가림 확인이 필요합니다." }),
  }),
  legibilityChecked: z.literal(true, {
    errorMap: () => ({ message: "사진 선명도 확인이 필요합니다." }),
  }),
  idempotencyKey: z.string().min(1),
});
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

export const replaceInputSchema = z.object({
  attemptId: z.string().min(1),
  problemPhotoRef: photoRefSchema.optional(),
  workPhotoRefs: z.array(photoRefSchema).min(1).max(3),
  confirmedPhotoRevision: z.number().int().min(0),
  privacyChecked: z.literal(true),
  legibilityChecked: z.literal(true),
  idempotencyKey: z.string().min(1),
});
export type ReplaceInputInput = z.infer<typeof replaceInputSchema>;

export const createRetrySchema = z.object({
  caseId: z.string().min(1),
  workPhotoRefs: z.array(photoRefSchema).min(1).max(3),
  confirmedPhotoRevision: z.number().int().min(0),
  privacyChecked: z.literal(true),
  legibilityChecked: z.literal(true),
  idempotencyKey: z.string().min(1),
});
export type CreateRetryInput = z.infer<typeof createRetrySchema>;

export const revealHintSchema = z.object({
  attemptId: z.string().min(1),
  resultVersion: z.number().int().min(1),
  level: z.number().int().min(1).max(3),
  idempotencyKey: z.string().min(1),
});
export type RevealHintInput = z.infer<typeof revealHintSchema>;

export const requestHelpSchema = z.object({
  caseId: z.string().min(1),
  message: z
    .string()
    .trim()
    .max(300, "도움 요청 메시지는 최대 300자까지 작성할 수 있습니다.")
    .default(""),
  idempotencyKey: z.string().min(1),
});
export type RequestHelpInput = z.infer<typeof requestHelpSchema>;

export const saveTeacherReviewSchema = z.object({
  caseId: z.string().min(1),
  attemptId: z.string().min(1),
  expectedVersion: z.number().int().min(1),
  verdict: z.enum(["CORRECT", "INCORRECT", "UNREADABLE", "UNDETERMINED"]),
  errorType: z.enum([
    "ARITHMETIC",
    "SIGN",
    "EQUALITY_TRANSFORM",
    "DISTRIBUTION",
    "FRACTION_OPERATION",
    "DOMAIN_CONDITION",
    "PROBLEM_INTERPRETATION",
    "LOGICAL_GAP",
    "UNKNOWN",
  ]),
  conceptId: z.enum([
    "M1_EQ_BALANCE",
    "M1_EQ_TRANSPOSE",
    "M1_DISTRIBUTION",
    "M1_RATIONAL_COEFFICIENT",
    "M1_EQ_BOTH_SIDES",
    "UNKNOWN",
  ]),
  errorRegion: errorRegionSchema.nullable(),
  publicStudentMessage: z.string().trim().min(5).max(500),
  internalTeacherMemo: z.string().trim().max(1000).optional(),
  overrideHints: z.array(z.string().trim().min(1).max(200)).max(3).optional(),
  idempotencyKey: z.string().min(1),
});
export type SaveTeacherReviewInput = z.infer<typeof saveTeacherReviewSchema>;

export const closeByTeacherSchema = z.object({
  caseId: z.string().min(1),
  expectedVersion: z.number().int().min(1),
  reason: z.string().trim().min(20, "종료 사유는 최소 20자 이상 입력해야 합니다.").max(1000),
  idempotencyKey: z.string().min(1),
});
export type CloseByTeacherInput = z.infer<typeof closeByTeacherSchema>;

export const grantExtraAttemptSchema = z.object({
  caseId: z.string().min(1),
  expectedVersion: z.number().int().min(1),
  reason: z.string().trim().min(10, "추가 시도 허용 사유는 10자 이상 입력해야 합니다.").max(300),
  idempotencyKey: z.string().min(1),
});
export type GrantExtraAttemptInput = z.infer<typeof grantExtraAttemptSchema>;

export const createReviewCandidateSchema = z.object({
  sourceCaseId: z.string().min(1),
  templateId: z.string().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  idempotencyKey: z.string().min(1),
});
export type CreateReviewCandidateInput = z.infer<typeof createReviewCandidateSchema>;

export const approveReviewItemSchema = z.object({
  reviewId: z.string().min(1),
  questionVersion: z.number().int().min(1),
  checklistPassed: z.boolean().refine((val) => val === true, {
    message: "모든 검수 기준을 확인하고 승인해야 합니다.",
  }),
  idempotencyKey: z.string().min(1),
});
export type ApproveReviewItemInput = z.infer<typeof approveReviewItemSchema>;

export const rejectReviewItemSchema = z.object({
  reviewId: z.string().min(1),
  questionVersion: z.number().int().min(1),
  reason: z.string().trim().min(10).max(500),
  idempotencyKey: z.string().min(1),
});
export type RejectReviewItemInput = z.infer<typeof rejectReviewItemSchema>;

export const saveReportDraftSchema = z.object({
  reportId: z.string().min(1),
  reportVersion: z.number().int().min(1),
  teacherComment: z.string().trim().min(20, "총평은 최소 20자 이상 입력해 주세요.").max(1000),
  homeQuestions: z.array(z.string().trim().min(10).max(200)).min(1).max(3),
  idempotencyKey: z.string().min(1),
});
export type SaveReportDraftInput = z.infer<typeof saveReportDraftSchema>;

export const publishReportSchema = z.object({
  reportId: z.string().min(1),
  reportVersion: z.number().int().min(1),
  idempotencyKey: z.string().min(1),
});
export type PublishReportInput = z.infer<typeof publishReportSchema>;

export const withdrawReportSchema = z.object({
  reportId: z.string().min(1),
  reason: z.string().trim().min(10, "회수 사유는 최소 10자 이상 입력해 주세요.").max(500),
  idempotencyKey: z.string().min(1),
});
export type WithdrawReportInput = z.infer<typeof withdrawReportSchema>;
