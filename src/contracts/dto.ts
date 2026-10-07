/**
 * 역할별 공개 DTO 정의
 * contracts/dto.ts
 */

import type {
  AccountStatus,
  CaseKind,
  CaseStatus,
  ConceptId,
  ErrorRegion,
  ErrorType,
  Improvement,
  JobStatus,
  PhotoRef,
  RecognizedLine,
  ReportStatus,
  ReviewItemStatus,
  ReviewStatus,
  Role,
  Verdict,
  RevealedHintItem,
} from "./domain";

export interface DemoSessionDto {
  actorId: string;
  name: string;
  role: Role;
  accountStatus: AccountStatus;
  loginId?: string | undefined;
  email?: string | undefined;
  gradeLevel?: number | undefined;
  availableLearners: Array<{
    learnerId: string;
    name: string;
    gradeLevel: number;
    relationStatus: "ACTIVE" | "INACTIVE";
  }>;
  mustChangePassword: boolean;
  consents: {
    serviceTerms: boolean;
    privacyPolicy: boolean;
    parentalConsent: boolean;
    consentVersion: string;
  };
}

export interface StudentCaseListItemDto {
  caseId: string;
  kind: CaseKind;
  bookTitle: string;
  page: number;
  problemNo: string;
  caseStatus: CaseStatus;
  verdict: Verdict;
  firstErrorLineId: string | null;
  conceptId: ConceptId;
  evaluatedCount: number;
  maxEvaluatedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentCaseDto {
  caseId: string;
  learnerId: string;
  kind: CaseKind;
  sourceCaseId: string | null;
  currentAttemptId: string;
  inputRevision: number;
  resultVersion: number;
  bookTitle: string;
  page: number;
  problemNo: string;
  unitId?: string | undefined;
  caseStatus: CaseStatus;
  verdict: Verdict;
  studentMessage: string;
  errorRegion: ErrorRegion | null;
  recognizedLines: RecognizedLine[];
  revealedHints: RevealedHintItem[];
  canRevealNextHint: boolean;
  canResubmit: boolean;
  canAskTeacher: boolean;
  revisionNotice: string | null;
  problemPhotoRef: PhotoRef;
  workPhotoRefs: PhotoRef[];
  evaluatedCount: number;
  maxEvaluatedCount: number;
  extraAttemptAllowance: number;
  helpRequested: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherCaseDto extends StudentCaseDto {
  candidateAnswer?: string | null | undefined;
  independentVerification?: string | null | undefined;
  internalTeacherMemo?: string | null | undefined;
  errorType?: ErrorType | undefined;
  conceptId?: ConceptId | undefined;
  allHints: string[];
  auditHistory: Array<{
    revision: number;
    changedAt: string;
    teacherId: string;
    action: string;
    comment?: string | undefined;
  }>;
}

export interface TeacherLearnerDto {
  learnerId: string;
  name: string;
  loginId: string;
  gradeLevel: number;
  relationStatus: "ACTIVE" | "INACTIVE";
  unitId?: string | undefined;
  totalSubmissions: number;
  initialAccuracyRate: number | null; // null represents denominator 0
  incorrectSubmissions: number;
  resolvedSubmissions: number;
  retryCompletionRate: number | null;
  waitingTeacherCount: number;
  repeatedConcepts: Array<{
    conceptId: ConceptId;
    count: number;
  }>;
  vulnerableConcepts: Array<{
    conceptId: ConceptId;
    initialErrorRate: number;
  }>;
  recentCases?: StudentCaseListItemDto[] | undefined;
  settingsVersion?: number | undefined;
  currentUnitId?: string | undefined;
  prerequisites?: string[] | undefined;
  allowedUnits?: string[] | undefined;
}

export interface TeacherReviewQueueItemDto {
  caseId: string;
  attemptId: string;
  learnerId: string;
  learnerName: string;
  gradeLevel: number;
  caseStatus: CaseStatus;
  verdict: Verdict;
  conceptId: ConceptId;
  helpRequested: boolean;
  helpMessage?: string | undefined;
  submittedAt: string;
  bookTitle?: string | undefined;
  page?: number | undefined;
  problemNo?: string | undefined;
  evaluatedCount?: number | undefined;
  reviewStatus?: ReviewStatus | undefined;
  createdAt?: string | undefined;
}

export type { CaseAttemptRecord } from "../domain/metrics";

export interface ReviewItemCandidateDto {
  reviewId: string;
  sourceCaseId: string;
  candidateIndex: number;
  questionVersion: number;
  status: ReviewItemStatus;
  problemText: string;
  conceptId: ConceptId;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  validationStatus: "PASS" | "FAIL" | "PENDING";
  createdAt: string;
  expectedAnswer?: string | undefined;
  independentVerification?: string | undefined;
  rejectionReason?: string | undefined;
  learnerName?: string | undefined;
  originalProblemTitle?: string | undefined;
}

export interface StudentReviewItemDto {
  reviewId: string;
  status: ReviewItemStatus;
  problemText: string;
  conceptId: ConceptId;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  startedAt?: string | undefined;
  completedAt?: string | undefined;
  sourceCaseId?: string | undefined;
  bookTitle?: string | undefined;
}

export interface ReportDraftDto {
  reportId: string;
  learnerId: string;
  learnerName: string;
  status: ReportStatus;
  fromDate: string;
  toDate: string;
  reportVersion: number;
  teacherComment: string;
  homeQuestions: string[];
  metricsSummary: {
    totalOriginalProblems: number;
    initialAccuracyPercent: number | null;
    retrySuccessRatePercent: number | null;
    vulnerableConcepts: string[];
    maxHintUsageLevel: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ParentPublishedReportDto {
  reportId: string;
  learnerId: string;
  learnerName: string;
  status: "PUBLISHED" | "WITHDRAWN";
  fromDate: string;
  toDate: string;
  teacherComment: string;
  homeQuestions: string[];
  metricsSummary: {
    totalOriginalProblems: number;
    initialAccuracyPercent: number | null;
    retrySuccessRatePercent: number | null;
    vulnerableConcepts: string[];
    maxHintUsageLevel: number;
  };
  publishedAt: string;
  withdrawnReason?: string | undefined;
}

export interface AdminSettingsDto {
  demoMode: boolean;
  scenario: string;
  accounts: Array<{
    actorId: string;
    role: Role;
    name: string;
    status: AccountStatus;
  }>;
  relations: Array<{
    teacherId: string;
    learnerId: string;
    status: "ACTIVE" | "INACTIVE";
  }>;
  parentRelations: Array<{
    parentId: string;
    learnerId: string;
    status: "ACTIVE" | "INACTIVE";
  }>;
  aiAutoReleaseEnabled: boolean;
  version: number;
}
