/**
 * 데이터 접근 Repository 인터페이스 정의
 * contracts/repository.ts
 */

import type { Result } from "./errors";
import type {
  AdminSettingsDto,
  DemoSessionDto,
  ParentPublishedReportDto,
  ReportDraftDto,
  ReviewItemCandidateDto,
  StudentCaseDto,
  StudentCaseListItemDto,
  StudentReviewItemDto,
  TeacherCaseDto,
  TeacherLearnerDto,
  TeacherReviewQueueItemDto,
} from "./dto";
import type {
  ApproveReviewItemInput,
  ChangePasswordInput,
  CloseByTeacherInput,
  CreateRetryInput,
  CreateReviewCandidateInput,
  CreateSubmissionInput,
  GrantExtraAttemptInput,
  LoginInput,
  PublishReportInput,
  RejectReviewItemInput,
  ReplaceInputInput,
  RequestHelpInput,
  RevealHintInput,
  SaveReportDraftInput,
  SaveTeacherReviewInput,
  WithdrawReportInput,
} from "./inputs";
import type { PhotoRef } from "./domain";

export interface IAppRepository {
  // 인증 및 데모 세션
  login(input: LoginInput): Promise<Result<DemoSessionDto>>;
  getSession(): Promise<Result<DemoSessionDto>>;
  setDemoSession(actorId: string): Promise<Result<DemoSessionDto>>;
  logout(): Promise<Result<{ success: true }>>;
  changePassword(input: ChangePasswordInput): Promise<Result<{ success: true }>>;
  requestPasswordReset(email: string): Promise<Result<{ success: true }>>;

  // 학생
  listCases(params?: {
    search?: string;
    status?: string;
    cursor?: string;
    pageSize?: number;
  }): Promise<Result<{ items: StudentCaseListItemDto[]; nextCursor?: string; hasMore: boolean }>>;
  getStudentCase(caseId: string): Promise<Result<StudentCaseDto>>;
  createSubmission(
    input: CreateSubmissionInput,
  ): Promise<Result<{ caseId: string; attemptId: string; version: number }>>;
  replaceInput(
    input: ReplaceInputInput,
  ): Promise<Result<{ caseId: string; attemptId: string; inputRevision: number }>>;
  createRetry(
    input: CreateRetryInput,
  ): Promise<Result<{ caseId: string; attemptId: string; version: number }>>;
  revealHint(
    input: RevealHintInput,
  ): Promise<Result<{ revealedLevel: number; hint: string; resultVersion: number }>>;
  requestHelp(input: RequestHelpInput): Promise<Result<{ caseId: string; helpRequested: boolean }>>;

  // 교사
  listLearners(): Promise<Result<{ items: TeacherLearnerDto[] }>>;
  getLearner(learnerId: string): Promise<Result<TeacherLearnerDto>>;
  listReviewQueue(): Promise<Result<{ items: TeacherReviewQueueItemDto[] }>>;
  getTeacherCase(caseId: string): Promise<Result<TeacherCaseDto>>;
  saveTeacherReview(
    input: SaveTeacherReviewInput,
  ): Promise<Result<{ caseId: string; resultVersion: number }>>;
  closeByTeacher(
    input: CloseByTeacherInput,
  ): Promise<Result<{ caseId: string; caseStatus: "TEACHER_CLOSED" }>>;
  grantExtraAttempt(
    input: GrantExtraAttemptInput,
  ): Promise<Result<{ caseId: string; extraAttemptAllowance: number }>>;
  updateLearningSettings(input: {
    learnerId: string;
    expectedVersion: number;
    currentUnitId: string;
    prerequisites: string[];
    allowedUnits: string[];
  }): Promise<Result<{ learnerId: string; settingsVersion: number }>>;

  // 복습
  createReviewCandidate(input: CreateReviewCandidateInput): Promise<Result<ReviewItemCandidateDto>>;
  getReviewCandidate(reviewId: string): Promise<Result<ReviewItemCandidateDto>>;
  approveReviewItem(
    input: ApproveReviewItemInput,
  ): Promise<Result<{ reviewId: string; status: "APPROVED" | "AVAILABLE" }>>;
  rejectReviewItem(
    input: RejectReviewItemInput,
  ): Promise<Result<{ reviewId: string; status: "REJECTED" }>>;
  editReviewCandidate(input: {
    reviewId: string;
    expectedVersion: number;
    problemText: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
  }): Promise<Result<{ reviewId: string; questionVersion: number }>>;
  listStudentReviews(): Promise<Result<{ items: StudentReviewItemDto[] }>>;
  submitStudentReview(
    reviewId: string,
    workPhotoRefs: PhotoRef[],
  ): Promise<Result<{ reviewId: string; success: boolean }>>;

  // 리포트
  requestReport(
    learnerId: string,
    fromDate: string,
    toDate: string,
  ): Promise<Result<{ reportId: string }>>;
  listReports(
    learnerId?: string,
  ): Promise<Result<{ drafts: ReportDraftDto[]; published: ParentPublishedReportDto[] }>>;
  getReportDraft(reportId: string): Promise<Result<ReportDraftDto>>;
  getPublishedReport(reportId: string): Promise<Result<ParentPublishedReportDto>>;
  saveReportDraft(
    input: SaveReportDraftInput,
  ): Promise<Result<{ reportId: string; reportVersion: number }>>;
  publishReport(
    input: PublishReportInput,
  ): Promise<Result<{ reportId: string; status: "PUBLISHED" }>>;
  withdrawReport(
    input: WithdrawReportInput,
  ): Promise<Result<{ reportId: string; status: "WITHDRAWN" }>>;

  // 관리자 및 데모 컨트롤
  getAdminSettings(): Promise<Result<AdminSettingsDto>>;
  createAccount(
    input: import("./admin").CreateAccountInput,
  ): Promise<Result<{ actorId: string; tempPassword?: string }>>;
  updateAccountStatus(
    input: import("./admin").UpdateAccountStatusInput,
  ): Promise<Result<{ actorId: string; status: import("./domain").AccountStatus }>>;
  assignRelations(
    input: import("./admin").AssignRelationsInput,
  ): Promise<Result<{ learnerId: string; success: true }>>;
  listConsents(): Promise<Result<{ items: import("./admin").ConsentRecordDto[] }>>;
  listDeletionRequests(): Promise<Result<{ items: import("./admin").DeletionRequestDto[] }>>;
  requestDeletion(
    actorId: string,
    reason: string,
  ): Promise<Result<{ requestId: string; status: import("./admin").DeletionRequestStatus }>>;
  stepDeletionDemo(
    requestId: string,
  ): Promise<Result<{ requestId: string; status: import("./admin").DeletionRequestStatus }>>;
  getAiOperationsConfig(): Promise<Result<import("./admin").AiOperationConfigDto>>;
  updateAiReleaseToggle(enabled: boolean): Promise<Result<{ aiReleaseEnabled: boolean }>>;
  listCorrectionRules(): Promise<Result<{ items: import("./admin").CorrectionRuleDto[] }>>;
  createCorrectionRule(
    input: import("./admin").CreateCorrectionRuleInput,
  ): Promise<Result<{ ruleId: string }>>;
  approveCorrectionRule(ruleId: string): Promise<Result<{ ruleId: string; status: "APPROVED" }>>;
  resetDemoData(): Promise<Result<{ success: true }>>;
  setDemoScenario(scenarioId: string): Promise<Result<{ success: true }>>;
}
