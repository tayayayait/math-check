/**
 * 상태 및 열거형 표준 한국어 라벨
 * domain/status-labels.ts
 */

import type {
  CaseStatus,
  ConceptId,
  ErrorType,
  ReportStatus,
  ReviewItemStatus,
  Role,
  Verdict,
} from "../contracts/domain";

export const VERDICT_LABELS: Record<Verdict, string> = {
  CORRECT: "정답",
  INCORRECT: "오답",
  UNREADABLE: "판독 불가",
  UNDETERMINED: "확인 필요",
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  PROCESSING: "진단 중",
  RETRY_REQUIRED: "재풀이 필요",
  WAITING_TEACHER: "선생님 확인 중",
  RESOLVED: "해결 완료",
  TEACHER_CLOSED: "선생님 종결",
};

export const REVIEW_ITEM_STATUS_LABELS: Record<ReviewItemStatus, string> = {
  GENERATING: "생성 중",
  PENDING_APPROVAL: "승인 대기",
  APPROVED: "승인 완료",
  AVAILABLE: "풀이 가능",
  IN_PROGRESS: "풀이 진행 중",
  COMPLETED: "학습 완료",
  GENERATION_FAILED: "생성 실패",
  REJECTED: "반려됨",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  REQUESTED: "발행 요청됨",
  DRAFT: "작성 중",
  PUBLISHED: "발행 완료",
  WITHDRAWN: "회수됨",
};

export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "학생",
  TEACHER: "선생님",
  PARENT: "학부모",
  ADMIN: "원장/관리자",
};

export const CONCEPT_LABELS: Record<ConceptId, string> = {
  M1_EQ_BALANCE: "등식의 성질",
  M1_EQ_TRANSPOSE: "이항",
  M1_DISTRIBUTION: "분배법칙",
  M1_RATIONAL_COEFFICIENT: "계수 정리 (소수·분수)",
  M1_EQ_BOTH_SIDES: "양변 정리 및 일차방정식 풀이",
  UNKNOWN: "미분류 개념",
};

export const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
  ARITHMETIC: "단순 계산 실수",
  SIGN: "부호 오류",
  EQUALITY_TRANSFORM: "등식 변형 오류",
  DISTRIBUTION: "분배법칙 오류",
  FRACTION_OPERATION: "분수·소수 연산 오류",
  DOMAIN_CONDITION: "정의역/조건 누락",
  PROBLEM_INTERPRETATION: "문제 해석 오류",
  LOGICAL_GAP: "논리적 비약",
  UNKNOWN: "미분류 오류",
};
