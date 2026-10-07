/**
 * 학습 분석 리포트 계약 및 스키마
 * contracts/report.ts
 */

import { z } from "zod";
import type { ReportStatus } from "./domain";

export interface ReportSummaryMetrics {
  /** 기간 내 확정 문제 수 (CORRECT + INCORRECT) */
  confirmedProblemCount: number;
  /** 기간 내 전체 원문 제출 수 */
  totalOriginalSubmissions: number;
  /** 최초 정답률 (백분율: 0 ~ 100, 분모 0 시 null) */
  initialAccuracyRate: number | null;
  /** 오답 문제 수 */
  incorrectProblemCount: number;
  /** 재풀이 완료 건수 */
  resolvedProblemCount: number;
  /** 재풀이 완료율 (백분율: 0 ~ 100, 분모 0 시 null) */
  retrySuccessRate: number | null;
  /** 교사 확인 대기 건수 */
  waitingTeacherCount: number;
  /** 주요 학습 개념 (최대 3개) */
  topConcepts: string[];
  /** 최대 힌트 사용 단계 */
  maxHintUsageLevel: number;
  /** 집계 기준 시각 (ISO) */
  calculatedAt: string;
}

export const requestReportSchema = z.object({
  learnerId: z.string().min(1, "학생을 선택해 주세요."),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "올바른 날짜 형식(YYYY-MM-DD)이어야 합니다."),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "올바른 날짜 형식(YYYY-MM-DD)이어야 합니다."),
  oralMemo: z
    .string()
    .trim()
    .min(10, "구두 요청 경로는 최소 10자 이상 기록해야 합니다.")
    .max(300)
    .optional(),
});
export type RequestReportInput = z.infer<typeof requestReportSchema>;

export const saveReportDraftSchema = z.object({
  reportId: z.string().min(1),
  expectedVersion: z.number().int().min(1),
  teacherComment: z
    .string()
    .trim()
    .min(20, "교사 총평은 최소 20자 이상 정성스럽게 작성해야 합니다.")
    .max(1000, "교사 총평은 최대 1000자까지 작성할 수 있습니다."),
  homeQuestions: z
    .array(
      z
        .string()
        .trim()
        .min(10, "가정 연계 질문은 각 최소 10자 이상 작성해 주세요.")
        .max(200, "가정 연계 질문은 각 최대 200자까지 작성할 수 있습니다."),
    )
    .min(1, "가정 연계 질문을 최소 1개 이상 등록해 주세요.")
    .max(3, "가정 연계 질문은 최대 3개까지 등록할 수 있습니다."),
  idempotencyKey: z.string().min(1),
});
export type SaveReportDraftInput = z.infer<typeof saveReportDraftSchema>;

export const publishReportSchema = z.object({
  reportId: z.string().min(1),
  expectedVersion: z.number().int().min(1),
  idempotencyKey: z.string().min(1),
});
export type PublishReportInput = z.infer<typeof publishReportSchema>;

export const withdrawReportSchema = z.object({
  reportId: z.string().min(1),
  reason: z
    .string()
    .trim()
    .min(10, "회수 사유는 최소 10자 이상 작성해야 합니다.")
    .max(500, "회수 사유는 최대 500자까지 작성할 수 있습니다."),
  idempotencyKey: z.string().min(1),
});
export type WithdrawReportInput = z.infer<typeof withdrawReportSchema>;
