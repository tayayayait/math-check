/**
 * 학습 분석 리포트 발행·회수 및 품질 정책 엔진
 * domain/report-policy.ts
 */

import type { ReportStatus } from "../contracts/domain";
import { getSeoulTodayString } from "./seoul-date";

/**
 * 리포트 조회 기간 검증 (최대 90일, 종료일 <= 오늘)
 */
export function validateReportDateRange(
  fromDate: string,
  toDate: string,
): { valid: boolean; reason?: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
    return { valid: false, reason: "날짜 형식(YYYY-MM-DD)이 올바르지 않습니다." };
  }

  const todayStr = getSeoulTodayString();
  if (toDate > todayStr) {
    return { valid: false, reason: "종료일은 오늘 이전이어야 합니다." };
  }

  if (fromDate > toDate) {
    return { valid: false, reason: "시작일이 종료일보다 늦을 수 없습니다." };
  }

  const fromTime = new Date(`${fromDate}T00:00:00+09:00`).getTime();
  const toTime = new Date(`${toDate}T00:00:00+09:00`).getTime();
  const diffDays = Math.round((toTime - fromTime) / (24 * 60 * 60 * 1000)) + 1;

  if (diffDays > 90) {
    return { valid: false, reason: "조회 기간은 최대 90일까지만 설정할 수 있습니다." };
  }

  return { valid: true };
}

/**
 * 금지 문구 목록 (순위, 학원 평균, 능력 단정 금지)
 */
const FORBIDDEN_COMMENT_PATTERNS = [
  /등수/i,
  /석차/i,
  /상위\s*\d+%/i,
  /학원\s*평균/i,
  /반\s*평균/i,
  /머리가\s*부족/i,
  /재능이\s*없/i,
  /지능/i,
];

/**
 * 교사 총평 유효성 및 합성 safety 검증
 */
export function validateTeacherComment(comment: string): {
  valid: boolean;
  reason?: string;
} {
  const trimmed = comment.trim();
  if (trimmed.length < 20) {
    return { valid: false, reason: "교사 총평은 최소 20자 이상 작성해야 합니다." };
  }
  if (trimmed.length > 1000) {
    return { valid: false, reason: "교사 총평은 최대 1000자까지 작성할 수 있습니다." };
  }

  for (const pattern of FORBIDDEN_COMMENT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        reason: "학습자 성장을 저해하는 순위, 학원 평균 또는 능력 단정 표현은 사용할 수 없습니다.",
      };
    }
  }

  return { valid: true };
}

/**
 * 가정 연계 질문 유효성 검증
 */
export function validateHomeQuestions(questions: string[]): {
  valid: boolean;
  reason?: string;
} {
  if (questions.length < 1 || questions.length > 3) {
    return { valid: false, reason: "가정 연계 질문은 1개 이상 3개 이하로 작성해야 합니다." };
  }

  for (let i = 0; i < questions.length; i++) {
    const q = (questions[i] ?? "").trim();
    if (q.length < 10) {
      return { valid: false, reason: `질문 ${i + 1}번은 최소 10자 이상 구체적으로 작성해 주세요.` };
    }
    if (q.length > 200) {
      return { valid: false, reason: `질문 ${i + 1}번은 최대 200자까지 작성할 수 있습니다.` };
    }
  }

  return { valid: true };
}

/**
 * 리포트 초안 수정 가능 여부
 */
export function canEditReportDraft(status: ReportStatus): boolean {
  return status === "REQUESTED" || status === "DRAFT";
}

/**
 * 리포트 정식 발행 가능 여부
 */
export function canPublishReport(
  status: ReportStatus,
  comment: string,
  questions: string[],
): boolean {
  if (status !== "DRAFT" && status !== "REQUESTED") return false;
  const commentRes = validateTeacherComment(comment);
  if (!commentRes.valid) return false;
  const questionRes = validateHomeQuestions(questions);
  if (!questionRes.valid) return false;
  return true;
}

/**
 * 리포트 수동 회수 가능 여부
 */
export function canWithdrawReport(status: ReportStatus): boolean {
  return status === "PUBLISHED";
}
