/**
 * 핵심 도메인 타입 정의
 * contracts/domain.ts
 */

export type Role = "STUDENT" | "TEACHER" | "PARENT" | "ADMIN";

export type AccountStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "DELETION_PENDING" | "DELETED";

export type JobStatus =
  "QUEUED" | "SANITIZING" | "ANALYZING" | "VERIFYING" | "SUCCEEDED" | "FAILED";

export type Verdict = "CORRECT" | "INCORRECT" | "UNREADABLE" | "UNDETERMINED";

export type CaseStatus =
  "PROCESSING" | "RETRY_REQUIRED" | "WAITING_TEACHER" | "RESOLVED" | "TEACHER_CLOSED";

export type ReviewStatus = "NONE" | "PENDING" | "IN_REVIEW" | "CONFIRMED" | "CORRECTED";

export type ReviewItemStatus =
  | "GENERATING"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "AVAILABLE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "GENERATION_FAILED"
  | "REJECTED";

export type ReportStatus = "REQUESTED" | "DRAFT" | "PUBLISHED" | "WITHDRAWN";

export type CaseKind = "ORIGINAL" | "REVIEW";

export type ConceptId =
  | "M1_EQ_BALANCE"
  | "M1_EQ_TRANSPOSE"
  | "M1_DISTRIBUTION"
  | "M1_RATIONAL_COEFFICIENT"
  | "M1_EQ_BOTH_SIDES"
  | "UNKNOWN";

export type ErrorType =
  | "ARITHMETIC"
  | "SIGN"
  | "EQUALITY_TRANSFORM"
  | "DISTRIBUTION"
  | "FRACTION_OPERATION"
  | "DOMAIN_CONDITION"
  | "PROBLEM_INTERPRETATION"
  | "LOGICAL_GAP"
  | "UNKNOWN";

export type Improvement = "RESOLVED" | "SAME_ERROR" | "NEW_ERROR" | "UNDETERMINED";

export type AttemptValidity = "CURRENT" | "STALE";

export type ReleaseSource = "AI_AUTO" | "TEACHER_CONFIRMED" | "NONE";

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ErrorRegion {
  lineId: string | null;
  bbox: BoundingBox | null;
}

export interface PhotoRef {
  clientPhotoId: string;
  purpose: "PROBLEM" | "WORK";
  order: number;
  width: number;
  height: number;
  mime: string;
  bytes: number;
  editedRevision: number;
}

export interface RecognizedLine {
  lineId: string;
  text: string;
}

export interface RevealedHintItem {
  level: number;
  text: string;
  revealedAt: string;
  resultVersion: number;
}
