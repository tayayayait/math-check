/**
 * 모의 데이터 인메모리 어댑터 및 레포지토리
 * services/demo-repository.ts
 */

import type { IAppRepository } from "../contracts/repository";
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
} from "../contracts/dto";
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
} from "../contracts/inputs";
import type { PhotoRef, AccountStatus } from "../contracts/domain";
import { createErrorResponse, createSuccessResponse, type Result } from "../contracts/errors";
import { DEMO_LIMITS } from "../contracts/limits";
import { STUDENT_FIXTURES } from "../data/demo/fixtures.student";
import { TEACHER_FIXTURES } from "../data/demo/fixtures.teacher";
import { PARENT_FIXTURES } from "../data/demo/fixtures.parent";
import { ADMIN_FIXTURE } from "../data/demo/fixtures.admin";
import { canResubmit, canAskTeacher, shouldCountAttempt } from "../domain/case-policy";
import type {
  ConsentRecordDto,
  DeletionRequestDto,
  DeletionRequestStatus,
  AiOperationConfigDto,
  CorrectionRuleDto,
  CreateAccountInput,
  UpdateAccountStatusInput,
  AssignRelationsInput,
  CreateCorrectionRuleInput,
} from "../contracts/admin";
import {
  validateInternalNo,
  validateTeacherAssignmentCount,
  validateParentAssignmentCount,
  generateTemporaryPassword,
  canApproveCorrectionRule,
} from "../domain/admin-policy";
import { validateHintRequest } from "../domain/hint-policy";
import { canCreateReviewCandidate } from "../domain/review-policy";
import { canPublishReport, canWithdrawReport } from "../domain/report-policy";
import { REVIEW_TEMPLATES } from "../data/demo/review-templates";
import { calculateMetrics, type CaseAttemptRecord } from "../domain/metrics";

export class DemoRepository implements IAppRepository {
  private currentSession: DemoSessionDto;
  private students = new Map<string, (typeof STUDENT_FIXTURES)[0]>();
  private teachers = new Map<string, (typeof TEACHER_FIXTURES)[0]>();
  private parents = new Map<string, (typeof PARENT_FIXTURES)[0]>();
  private admin = ADMIN_FIXTURE;

  // 전체 케이스 저장소 (caseId -> TeacherCaseDto)
  private cases = new Map<string, TeacherCaseDto>();

  // 복습 문제 저장소 (reviewId -> ReviewItemCandidateDto)
  private reviewCandidates = new Map<string, ReviewItemCandidateDto>();

  // 리포트 저장소 (reportId -> ReportDraftDto)
  private reports = new Map<string, ReportDraftDto>();

  // 멱등성 캐시 (key -> Result<unknown>)
  private idempotencyCache = new Map<string, Result<unknown>>();

  // Phase 8: 동의, 삭제 요청, AI 운영 및 교정 규칙
  private consents = new Map<string, ConsentRecordDto>();
  private deletionRequests = new Map<string, DeletionRequestDto>();
  private aiConfig: AiOperationConfigDto = {
    aiReleaseEnabled: true,
    monthlyBudgetKrw: 100000,
    currentMonthSpentKrw: 84000,
    totalDiagnosisCalls: 420,
    activeModelName: "MathSolver-OCR-Pro v2.4",
    promptVersion: "prompt_diag_202610_v3",
    supportedUnits: [
      { unitId: "M1_LINEAR_EQUATIONS", unitName: "중1 일차방정식", status: "AUTO_ENABLED" },
      { unitId: "M2_SYSTEM_OF_EQUATIONS", unitName: "중2 연립일차방정식", status: "MANUAL_ONLY" },
      { unitId: "M3_QUADRATIC_EQUATIONS", unitName: "중3 이차방정식", status: "MANUAL_ONLY" },
    ],
  };
  private correctionRules = new Map<string, CorrectionRuleDto>();

  constructor() {
    this.resetToFixtures();
    // 기본 세션: 학생 A (김민수)
    const initialStudent = this.students.get("usr_student_01");
    this.currentSession = initialStudent
      ? { ...initialStudent.session }
      : { ...STUDENT_FIXTURES[0]!.session };
  }

  private resetToFixtures(): void {
    this.students.clear();
    for (const s of STUDENT_FIXTURES) {
      const cloned = JSON.parse(JSON.stringify(s)) as typeof s;
      this.students.set(s.session.actorId, cloned);
      for (const c of cloned.cases) {
        const teacherCase: TeacherCaseDto = {
          ...c,
          revealedHints: [...c.revealedHints],
          allHints: [
            "좌변에 있던 +5를 우변으로 옮길 때 부호가 어떻게 바뀌어야 할까요?",
            "3x = 14 - 5 로 계산하면 우변은 무엇이 되나요?",
            "양변을 x의 계수인 3으로 나누면 x의 값은 무엇이 되나요?",
          ],
          auditHistory: [],
        };
        this.cases.set(c.caseId, teacherCase);
      }
    }

    this.teachers.clear();
    for (const t of TEACHER_FIXTURES) {
      this.teachers.set(t.session.actorId, JSON.parse(JSON.stringify(t)));
    }

    this.parents.clear();
    for (const p of PARENT_FIXTURES) {
      this.parents.set(p.session.actorId, JSON.parse(JSON.stringify(p)));
    }

    this.reviewCandidates.clear();
    const tpl1 = REVIEW_TEMPLATES[0]!;
    this.reviewCandidates.set("rev_01", {
      reviewId: "rev_01",
      sourceCaseId: "case_01",
      candidateIndex: 1,
      questionVersion: 1,
      status: "PENDING_APPROVAL",
      problemText: tpl1.problemText,
      conceptId: tpl1.conceptId,
      difficulty: "EASY",
      validationStatus: "PASS",
      createdAt: new Date().toISOString(),
      expectedAnswer: tpl1.expectedAnswer,
      independentVerification: tpl1.independentVerification,
      learnerName: "김민수",
      originalProblemTitle: "개념원리 중1-1 (42쪽 #5)",
    });

    const tpl2 = REVIEW_TEMPLATES[3]!;
    this.reviewCandidates.set("rev_02", {
      reviewId: "rev_02",
      sourceCaseId: "case_02",
      candidateIndex: 1,
      questionVersion: 1,
      status: "APPROVED",
      problemText: tpl2.problemText,
      conceptId: tpl2.conceptId,
      difficulty: "MEDIUM",
      validationStatus: "PASS",
      createdAt: new Date().toISOString(),
      expectedAnswer: tpl2.expectedAnswer,
      independentVerification: tpl2.independentVerification,
      learnerName: "이서연",
      originalProblemTitle: "쎈 중1-1 (55쪽 #12)",
    });

    const tpl3 = REVIEW_TEMPLATES[4]!;
    this.reviewCandidates.set("rev_03", {
      reviewId: "rev_03",
      sourceCaseId: "case_03",
      candidateIndex: 1,
      questionVersion: 1,
      status: "AVAILABLE",
      problemText: tpl3.problemText,
      conceptId: tpl3.conceptId,
      difficulty: "EASY",
      validationStatus: "PASS",
      createdAt: new Date().toISOString(),
      expectedAnswer: tpl3.expectedAnswer,
      independentVerification: tpl3.independentVerification,
      learnerName: "김민수",
      originalProblemTitle: "개념원리 중1-1 (48쪽 #9)",
    });

    this.reports.clear();
    this.reports.set("rep_01", {
      reportId: "rep_01",
      learnerId: "usr_student_01",
      learnerName: "김민수",
      status: "DRAFT",
      fromDate: "2026-09-01",
      toDate: "2026-09-30",
      reportVersion: 1,
      teacherComment:
        "일차방정식 단원에서 이항 시 부호 변경 원리를 꼼꼼하게 점검하고 있으며, 오답 후 재풀이 시 100% 정답에 도달하는 끈기 있는 학습 태도를 보여주고 있습니다.",
      homeQuestions: [
        "가정에서 식을 옮길 때 왜 등호 반대편으로 넘어가면 부호가 바뀌는지 자녀의 설명을 들어봐 주세요.",
        "수학 문제를 풀 때 검산하는 습관에 대해 칭찬과 격려를 부탁드립니다.",
      ],
      metricsSummary: {
        totalOriginalProblems: 4,
        initialAccuracyPercent: 50.0,
        retrySuccessRatePercent: 100.0,
        vulnerableConcepts: ["이항", "부호"],
        maxHintUsageLevel: 2,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.reports.set("rep_02", {
      reportId: "rep_02",
      learnerId: "usr_student_01",
      learnerName: "김민수",
      status: "PUBLISHED",
      fromDate: "2026-08-01",
      toDate: "2026-08-31",
      reportVersion: 1,
      teacherComment:
        "방정식의 기초 성질과 등식의 성질을 매우 훌륭하게 습득하였습니다. 차분하게 풀이 과정을 적어나가는 기본기가 매우 탄탄합니다.",
      homeQuestions: ["8월 한 달 동안 수학 문제를 꾸준히 풀어낸 성실성을 많이 칭찬해 주세요."],
      metricsSummary: {
        totalOriginalProblems: 5,
        initialAccuracyPercent: 80.0,
        retrySuccessRatePercent: 100.0,
        vulnerableConcepts: ["사칙연산"],
        maxHintUsageLevel: 1,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.consents.clear();
    this.consents.set("cst_01", {
      consentId: "cst_01",
      learnerId: "usr_student_01",
      learnerName: "김민수",
      isUnder14: true,
      legalGuardianName: "김학부모",
      coreLearningConsent: true,
      externalAiConsent: true,
      parentReportConsent: true,
      verificationMethod: "VERIFIED_PARENT_ACCOUNT",
      consentVersion: "v1.0",
      agreedAt: "2026-09-01T09:00:00Z",
      proofStatus: "VERIFIED",
    });
    this.consents.set("cst_02", {
      consentId: "cst_02",
      learnerId: "usr_student_02",
      learnerName: "이지우",
      isUnder14: true,
      legalGuardianName: "이학부모",
      coreLearningConsent: true,
      externalAiConsent: false,
      parentReportConsent: true,
      verificationMethod: "SIGNED_FORM",
      consentVersion: "v1.0",
      agreedAt: "2026-09-02T10:00:00Z",
      proofStatus: "VERIFIED",
    });
    this.consents.set("cst_03", {
      consentId: "cst_03",
      learnerId: "usr_student_03",
      learnerName: "박하은",
      isUnder14: true,
      legalGuardianName: "박학부모",
      coreLearningConsent: false,
      externalAiConsent: false,
      parentReportConsent: false,
      verificationMethod: "SIGNED_FORM",
      consentVersion: "v1.0",
      agreedAt: "2026-09-03T11:00:00Z",
      proofStatus: "PENDING_PROOF",
    });

    this.deletionRequests.clear();
    this.deletionRequests.set("del_01", {
      requestId: "del_01",
      actorId: "usr_student_03",
      actorName: "박하은",
      role: "STUDENT",
      reason: "학원 퇴원으로 인한 개인정보 삭제 요청",
      status: "BLOCKED",
      requestedAt: "2026-09-28T14:00:00Z",
    });
    this.deletionRequests.set("del_02", {
      requestId: "del_02",
      actorId: "usr_student_02",
      actorName: "이지우",
      role: "STUDENT",
      reason: "서비스 이용 종료에 따른 모의 계정 삭제 처리",
      status: "PURGING",
      requestedAt: "2026-09-25T10:00:00Z",
    });

    this.correctionRules.clear();
    this.correctionRules.set("rule_01", {
      ruleId: "rule_01",
      ruleTitle: "이항 시 부호 반전 규칙 명시적 교정",
      conceptId: "M1_EQ_TRANSPOSE",
      errorType: "SIGN",
      appliesWhen:
        "방정식에서 좌변의 항을 우변으로 이항할 때 부호를 바꾸지 않고 그대로 유지한 경우",
      correctionPrinciple:
        "이항은 양변에 같은 수를 더하거나 빼는 등식의 성질에서 비롯되므로, 부호가 반드시 반대로 바뀜을 단계적으로 안내",
      counterExamples: ["3x + 5 = 14 에서 3x = 14 + 5 로 잘못 쓴 오답"],
      syntheticExamples: ["3x = 14 - 5"],
      version: 1,
      status: "ACTIVE",
      privacyCheckPassed: true,
      regressionEvalStatus: "PASS",
      createdAt: "2026-09-10T10:00:00Z",
      updatedAt: "2026-09-15T10:00:00Z",
    });
    this.correctionRules.set("rule_02", {
      ruleId: "rule_02",
      ruleTitle: "괄호 앞 음수 계수 분배법칙 누락 교정",
      conceptId: "M1_DISTRIBUTION",
      errorType: "DISTRIBUTION",
      appliesWhen:
        "-(2x - 3)과 같이 음수가 곱해진 괄호를 전개할 때 뒤 항의 부호를 반전시키지 않은 경우",
      correctionPrinciple:
        "괄호 앞의 마이너스 부호는 -1이 곱해진 것과 같으므로 괄호 안의 모든 항에 -1을 곱해야 함을 상기",
      counterExamples: ["-(2x - 3) = -2x - 3 으로 전개한 오답"],
      syntheticExamples: ["-(2x - 3) = -2x + 3"],
      version: 1,
      status: "DRAFT",
      privacyCheckPassed: true,
      regressionEvalStatus: "PASS",
      createdAt: "2026-09-20T10:00:00Z",
      updatedAt: "2026-09-20T10:00:00Z",
    });

    this.idempotencyCache.clear();
  }

  // --- 인증 및 데모 세션 ---
  async login(input: LoginInput): Promise<Result<DemoSessionDto>> {
    if (input.kind === "STUDENT") {
      for (const s of this.students.values()) {
        if (s.session.loginId === input.loginId) {
          this.currentSession = { ...s.session };
          return createSuccessResponse(this.currentSession);
        }
      }
      return createErrorResponse("UNAUTHORIZED", "일치하는 학생 계정을 찾을 수 없습니다.");
    }

    // TEACHER, PARENT, ADMIN 검색
    for (const t of this.teachers.values()) {
      if (t.session.email === input.email) {
        this.currentSession = { ...t.session };
        return createSuccessResponse(this.currentSession);
      }
    }
    for (const p of this.parents.values()) {
      if (p.session.email === input.email) {
        this.currentSession = { ...p.session };
        return createSuccessResponse(this.currentSession);
      }
    }
    if (this.admin.session.email === input.email) {
      this.currentSession = { ...this.admin.session };
      return createSuccessResponse(this.currentSession);
    }

    return createErrorResponse("UNAUTHORIZED", "아이디 또는 비밀번호가 일치하지 않습니다.");
  }

  async getSession(): Promise<Result<DemoSessionDto>> {
    return createSuccessResponse({ ...this.currentSession });
  }

  async setDemoSession(actorId: string): Promise<Result<DemoSessionDto>> {
    const s = this.students.get(actorId);
    if (s) {
      this.currentSession = { ...s.session };
      return createSuccessResponse(this.currentSession);
    }
    const t = this.teachers.get(actorId);
    if (t) {
      this.currentSession = { ...t.session };
      return createSuccessResponse(this.currentSession);
    }
    const p = this.parents.get(actorId);
    if (p) {
      this.currentSession = { ...p.session };
      return createSuccessResponse(this.currentSession);
    }
    if (this.admin.session.actorId === actorId) {
      this.currentSession = { ...this.admin.session };
      return createSuccessResponse(this.currentSession);
    }
    return createErrorResponse("NOT_FOUND", "해당 사용자를 찾을 수 없습니다.");
  }

  async logout(): Promise<Result<{ success: true }>> {
    // 기본 학생 세션으로 안전 복귀
    const s = this.students.get("usr_student_01");
    if (s) this.currentSession = { ...s.session };
    return createSuccessResponse({ success: true });
  }

  async changePassword(input: ChangePasswordInput): Promise<Result<{ success: true }>> {
    if (this.currentSession.mustChangePassword) {
      this.currentSession.mustChangePassword = false;
      this.currentSession.accountStatus = "ACTIVE";
    }
    return createSuccessResponse({ success: true });
  }

  async requestPasswordReset(email: string): Promise<Result<{ success: true }>> {
    return createSuccessResponse({ success: true });
  }

  // --- 학생 ---
  async listCases(params?: {
    search?: string;
    status?: string;
    cursor?: string;
    pageSize?: number;
  }): Promise<Result<{ items: StudentCaseListItemDto[]; nextCursor?: string; hasMore: boolean }>> {
    const learnerId = this.currentSession.actorId;
    const items: StudentCaseListItemDto[] = [];

    for (const c of this.cases.values()) {
      if (c.learnerId !== learnerId) continue;
      if (params?.status && c.caseStatus !== params.status) continue;
      if (params?.search) {
        const q = params.search.toLowerCase();
        if (
          !c.bookTitle.toLowerCase().includes(q) &&
          !c.problemNo.includes(q) &&
          !String(c.page).includes(q)
        ) {
          continue;
        }
      }

      items.push({
        caseId: c.caseId,
        kind: c.kind,
        bookTitle: c.bookTitle,
        page: c.page,
        problemNo: c.problemNo,
        caseStatus: c.caseStatus,
        verdict: c.verdict,
        firstErrorLineId: c.errorRegion?.lineId ?? null,
        conceptId: c.conceptId ?? "UNKNOWN",
        evaluatedCount: c.evaluatedCount,
        maxEvaluatedCount: c.maxEvaluatedCount,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      });
    }

    // 최신 순 정렬
    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return createSuccessResponse({ items, hasMore: false });
  }

  async getStudentCase(caseId: string): Promise<Result<StudentCaseDto>> {
    const c = this.cases.get(caseId);
    if (!c) {
      return createErrorResponse("NOT_FOUND", "요청한 진단 건을 찾을 수 없습니다.");
    }

    // 권한 검사: 학생인 경우 본인의 케이스만 접근 가능
    if (this.currentSession.role === "STUDENT" && c.learnerId !== this.currentSession.actorId) {
      return createErrorResponse("FORBIDDEN", "본인의 진단 결과만 조회할 수 있습니다.");
    }

    // 학생 공개 DTO 변환 (내부 메모, auditHistory, 비공개 힌트 원문 제거)
    const studentDto: StudentCaseDto = {
      caseId: c.caseId,
      learnerId: c.learnerId,
      kind: c.kind,
      sourceCaseId: c.sourceCaseId,
      currentAttemptId: c.currentAttemptId,
      inputRevision: c.inputRevision,
      resultVersion: c.resultVersion,
      bookTitle: c.bookTitle,
      page: c.page,
      problemNo: c.problemNo,
      unitId: c.unitId,
      caseStatus: c.caseStatus,
      verdict: c.verdict,
      studentMessage: c.studentMessage,
      errorRegion: c.errorRegion,
      recognizedLines: c.recognizedLines,
      revealedHints: c.revealedHints,
      canRevealNextHint: c.canRevealNextHint,
      canResubmit: c.canResubmit,
      canAskTeacher: c.canAskTeacher,
      revisionNotice: c.revisionNotice,
      problemPhotoRef: c.problemPhotoRef,
      workPhotoRefs: c.workPhotoRefs,
      evaluatedCount: c.evaluatedCount,
      maxEvaluatedCount: c.maxEvaluatedCount,
      extraAttemptAllowance: c.extraAttemptAllowance,
      helpRequested: c.helpRequested,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };

    return createSuccessResponse(studentDto);
  }

  async createSubmission(
    input: CreateSubmissionInput,
  ): Promise<Result<{ caseId: string; attemptId: string; version: number }>> {
    const cached = this.idempotencyCache.get(input.idempotencyKey);
    if (cached) {
      return cached as Result<{ caseId: string; attemptId: string; version: number }>;
    }

    const learnerId = this.currentSession.actorId;
    const caseId = `case_new_${Date.now()}`;
    const attemptId = `att_${caseId}_1`;

    const newCase: TeacherCaseDto = {
      caseId,
      learnerId,
      kind: "ORIGINAL",
      sourceCaseId: null,
      currentAttemptId: attemptId,
      inputRevision: 1,
      resultVersion: 1,
      bookTitle: input.bookTitle,
      page: input.page,
      problemNo: input.problemNo,
      unitId: input.unitId || "M1_LINEAR_EQUATIONS",
      caseStatus: "RETRY_REQUIRED",
      verdict: "INCORRECT",
      studentMessage: "부호 계산에 유의하여 다시 확인해 보세요.",
      errorRegion: {
        lineId: "L02",
        bbox: { x: 0.1, y: 0.2, w: 0.8, h: 0.2 },
      },
      recognizedLines: [
        { lineId: "L01", text: "2x + 4 = 12" },
        { lineId: "L02", text: "2x = 12 + 4" },
      ],
      revealedHints: [],
      canRevealNextHint: true,
      canResubmit: true,
      canAskTeacher: true,
      revisionNotice: null,
      problemPhotoRef: input.problemPhotoRef,
      workPhotoRefs: input.workPhotoRefs,
      evaluatedCount: 1,
      maxEvaluatedCount: DEMO_LIMITS.DEFAULT_MAX_ATTEMPTS,
      extraAttemptAllowance: 0,
      helpRequested: false,
      allHints: ["이항할 때 부호에 주의하세요.", "양변을 2로 나누어 x의 값을 구해 보세요."],
      auditHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.cases.set(caseId, newCase);

    const res = createSuccessResponse({ caseId, attemptId, version: 1 });
    this.idempotencyCache.set(input.idempotencyKey, res);
    return res;
  }

  async replaceInput(
    input: ReplaceInputInput,
  ): Promise<Result<{ caseId: string; attemptId: string; inputRevision: number }>> {
    // attemptId로 해당 케이스 탐색
    for (const c of this.cases.values()) {
      if (c.currentAttemptId === input.attemptId) {
        c.inputRevision += 1;
        c.workPhotoRefs = input.workPhotoRefs;
        c.updatedAt = new Date().toISOString();
        return createSuccessResponse({
          caseId: c.caseId,
          attemptId: c.currentAttemptId,
          inputRevision: c.inputRevision,
        });
      }
    }
    return createErrorResponse("NOT_FOUND", "해당 시도 건을 찾을 수 없습니다.");
  }

  async createRetry(
    input: CreateRetryInput,
  ): Promise<Result<{ caseId: string; attemptId: string; version: number }>> {
    const c = this.cases.get(input.caseId);
    if (!c) {
      return createErrorResponse("NOT_FOUND", "해당 케이스를 찾을 수 없습니다.");
    }

    const policyCtx = {
      caseStatus: c.caseStatus,
      evaluatedCount: c.evaluatedCount,
      extraAttemptAllowance: c.extraAttemptAllowance,
      hasActiveJob: false,
      helpRequested: c.helpRequested,
    };

    if (!canResubmit(policyCtx)) {
      return createErrorResponse("QUOTA_EXCEEDED", "최대 재풀이 허용 횟수를 초과하였습니다.");
    }

    c.evaluatedCount += 1;
    c.inputRevision += 1;
    c.resultVersion += 1;
    c.currentAttemptId = `att_${c.caseId}_${c.evaluatedCount}`;
    c.workPhotoRefs = input.workPhotoRefs;
    c.updatedAt = new Date().toISOString();

    // 4회째이고 정답이 안 된 경우
    if (c.evaluatedCount >= c.maxEvaluatedCount) {
      c.canResubmit = false;
      c.caseStatus = "WAITING_TEACHER";
      c.studentMessage = "최대 재풀이 횟수를 모두 시도했습니다. 선생님께 확인을 요청해 보세요.";
    }

    return createSuccessResponse({
      caseId: c.caseId,
      attemptId: c.currentAttemptId,
      version: c.resultVersion,
    });
  }

  async revealHint(
    input: RevealHintInput,
  ): Promise<Result<{ revealedLevel: number; hint: string; resultVersion: number }>> {
    let targetCase: TeacherCaseDto | null = null;
    for (const c of this.cases.values()) {
      if (c.currentAttemptId === input.attemptId) {
        targetCase = c;
        break;
      }
    }

    if (!targetCase) {
      return createErrorResponse("NOT_FOUND", "해당 진단 건을 찾을 수 없습니다.");
    }

    if (input.resultVersion !== targetCase.resultVersion) {
      return createErrorResponse(
        "VERSION_CONFLICT",
        "결과 버전이 일치하지 않습니다. 화면을 새로고침해 주세요.",
      );
    }

    // 멱등 요청 처리: 이미 공개된 레벨이면 기존 내용 반환
    const existing = targetCase.revealedHints.find((h) => h.level === input.level);
    if (existing) {
      return createSuccessResponse({
        revealedLevel: existing.level,
        hint: existing.text,
        resultVersion: targetCase.resultVersion,
      });
    }

    const policyCtx = {
      verdict: targetCase.verdict,
      currentRevealedLevel: targetCase.revealedHints.length,
      totalAvailableHints: targetCase.allHints.length,
      isLatestAttempt: true,
      helpRequested: targetCase.helpRequested,
      isStaleResult: false,
    };

    const validation = validateHintRequest(policyCtx, input.level);
    if (!validation.valid) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        validation.reason || "힌트를 열람할 수 없습니다.",
      );
    }

    const hintText = targetCase.allHints[input.level - 1] ?? "차근차근 식을 다시 확인해 보세요.";
    targetCase.revealedHints.push({
      level: input.level,
      text: hintText,
      revealedAt: new Date().toISOString(),
      resultVersion: targetCase.resultVersion,
    });

    targetCase.canRevealNextHint = targetCase.revealedHints.length < targetCase.allHints.length;
    targetCase.updatedAt = new Date().toISOString();

    return createSuccessResponse({
      revealedLevel: input.level,
      hint: hintText,
      resultVersion: targetCase.resultVersion,
    });
  }

  async requestHelp(
    input: RequestHelpInput,
  ): Promise<Result<{ caseId: string; helpRequested: boolean }>> {
    const c = this.cases.get(input.caseId);
    if (!c) {
      return createErrorResponse("NOT_FOUND", "해당 진단 건을 찾을 수 없습니다.");
    }

    c.helpRequested = true;
    c.caseStatus = "WAITING_TEACHER";
    c.canRevealNextHint = false;
    c.canAskTeacher = false;
    c.updatedAt = new Date().toISOString();

    return createSuccessResponse({ caseId: c.caseId, helpRequested: true });
  }

  // --- 교사 ---
  async listLearners(): Promise<Result<{ items: TeacherLearnerDto[] }>> {
    const teacherId = this.currentSession.actorId;
    const teacher = this.teachers.get(teacherId) ?? TEACHER_FIXTURES[0]!;
    const items: TeacherLearnerDto[] = [];

    for (const studentId of teacher.assignedStudentIds) {
      const student = this.students.get(studentId);
      if (!student) continue;

      // 학생의 모든 제출 기록 수집
      const records: CaseAttemptRecord[] = [];
      for (const c of this.cases.values()) {
        if (c.learnerId !== studentId) continue;
        records.push({
          caseId: c.caseId,
          kind: c.kind,
          attemptIndex: 0,
          verdict: c.verdict,
          conceptId: c.conceptId ?? "UNKNOWN",
          createdAt: c.createdAt,
          caseStatus: c.caseStatus,
          helpRequested: c.helpRequested,
          reviewStatus: "NONE",
          maxHintLevelUsed: c.revealedHints.length,
        });
      }

      const metrics = calculateMetrics(records);

      const recentCases: StudentCaseListItemDto[] = Array.from(this.cases.values())
        .filter((c) => c.learnerId === studentId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map((c) => ({
          caseId: c.caseId,
          kind: c.kind,
          bookTitle: c.bookTitle,
          page: c.page,
          problemNo: c.problemNo,
          verdict: c.verdict,
          caseStatus: c.caseStatus,
          firstErrorLineId: c.errorRegion?.lineId ?? null,
          conceptId: c.conceptId ?? "UNKNOWN",
          evaluatedCount: c.evaluatedCount,
          maxEvaluatedCount: c.maxEvaluatedCount,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));

      items.push({
        learnerId: student.session.actorId,
        name: student.session.name,
        loginId: student.session.loginId || "",
        gradeLevel: student.session.gradeLevel || 1,
        relationStatus: "ACTIVE",
        unitId: "M1_LINEAR_EQUATIONS",
        totalSubmissions: metrics.totalOriginalProblems,
        initialAccuracyRate: metrics.initialAccuracyRate,
        incorrectSubmissions: metrics.incorrectProblemCount,
        resolvedSubmissions: metrics.resolvedProblemCount,
        retryCompletionRate: metrics.retrySuccessRate,
        waitingTeacherCount: metrics.waitingTeacherCount,
        repeatedConcepts: metrics.repeatedConcepts,
        vulnerableConcepts: metrics.vulnerableConcepts,
        recentCases,
        settingsVersion: 1,
        currentUnitId: "M1_LINEAR_EQUATIONS",
        prerequisites: ["기초 사칙연산", "유리수 연산"],
        allowedUnits: ["일차방정식", "연립일차방정식", "일차부등식"],
      });
    }

    return createSuccessResponse({ items });
  }

  async getLearner(learnerId: string): Promise<Result<TeacherLearnerDto>> {
    const listRes = await this.listLearners();
    if ("error" in listRes) return listRes;

    const found = listRes.data.items.find((i) => i.learnerId === learnerId);
    if (!found) {
      return createErrorResponse("NOT_FOUND", "해당 학생 정보를 찾을 수 없습니다.");
    }
    return createSuccessResponse(found);
  }

  async listReviewQueue(): Promise<Result<{ items: TeacherReviewQueueItemDto[] }>> {
    const items: TeacherReviewQueueItemDto[] = [];

    for (const c of this.cases.values()) {
      if (c.caseStatus === "WAITING_TEACHER" || c.helpRequested) {
        const student = this.students.get(c.learnerId);
        items.push({
          caseId: c.caseId,
          attemptId: c.currentAttemptId,
          learnerId: c.learnerId,
          learnerName: student?.session.name || "학생",
          gradeLevel: student?.session.gradeLevel || 1,
          caseStatus: c.caseStatus,
          verdict: c.verdict,
          conceptId: c.conceptId ?? "UNKNOWN",
          helpRequested: c.helpRequested,
          submittedAt: c.updatedAt,
          bookTitle: c.bookTitle,
          page: c.page,
          problemNo: c.problemNo,
          evaluatedCount: c.evaluatedCount,
          reviewStatus: c.caseStatus === "WAITING_TEACHER" ? "PENDING" : "NONE",
          createdAt: c.createdAt,
        });
      }
    }

    return createSuccessResponse({ items });
  }

  async getTeacherCase(caseId: string): Promise<Result<TeacherCaseDto>> {
    const c = this.cases.get(caseId);
    if (!c) {
      return createErrorResponse("NOT_FOUND", "해당 진단 건을 찾을 수 없습니다.");
    }
    return createSuccessResponse({ ...c });
  }

  async saveTeacherReview(
    input: SaveTeacherReviewInput,
  ): Promise<Result<{ caseId: string; resultVersion: number }>> {
    const c = this.cases.get(input.caseId);
    if (!c) {
      return createErrorResponse("NOT_FOUND", "해당 진단 건을 찾을 수 없습니다.");
    }

    if (c.resultVersion !== input.expectedVersion) {
      return createErrorResponse(
        "VERSION_CONFLICT",
        "결과 버전이 일치하지 않습니다. 다른 교사가 이미 검수했을 수 있습니다.",
      );
    }

    c.verdict = input.verdict;
    c.errorType = input.errorType;
    c.conceptId = input.conceptId;
    c.errorRegion = input.errorRegion;
    c.studentMessage = input.publicStudentMessage;
    c.internalTeacherMemo = input.internalTeacherMemo ?? null;
    c.resultVersion += 1;
    c.helpRequested = false;

    if (input.verdict === "CORRECT") {
      c.caseStatus = "RESOLVED";
      c.canResubmit = false;
      c.canRevealNextHint = false;
    } else {
      c.caseStatus = "RETRY_REQUIRED";
    }

    if (input.overrideHints) {
      c.allHints = input.overrideHints;
    }

    c.auditHistory.push({
      revision: c.auditHistory.length + 1,
      changedAt: new Date().toISOString(),
      teacherId: this.currentSession.actorId,
      action: "TEACHER_REVIEW_SAVED",
      comment: input.internalTeacherMemo,
    });
    c.updatedAt = new Date().toISOString();

    return createSuccessResponse({ caseId: c.caseId, resultVersion: c.resultVersion });
  }

  async closeByTeacher(
    input: CloseByTeacherInput,
  ): Promise<Result<{ caseId: string; caseStatus: "TEACHER_CLOSED" }>> {
    const c = this.cases.get(input.caseId);
    if (!c) {
      return createErrorResponse("NOT_FOUND", "해당 진단 건을 찾을 수 없습니다.");
    }

    c.caseStatus = "TEACHER_CLOSED";
    c.canResubmit = false;
    c.canRevealNextHint = false;
    c.canAskTeacher = false;
    c.internalTeacherMemo = input.reason;
    c.auditHistory.push({
      revision: c.auditHistory.length + 1,
      changedAt: new Date().toISOString(),
      teacherId: this.currentSession.actorId,
      action: "CASE_CLOSED_BY_TEACHER",
      comment: input.reason,
    });
    c.updatedAt = new Date().toISOString();

    return createSuccessResponse({ caseId: c.caseId, caseStatus: "TEACHER_CLOSED" });
  }

  async grantExtraAttempt(
    input: GrantExtraAttemptInput,
  ): Promise<Result<{ caseId: string; extraAttemptAllowance: number }>> {
    const c = this.cases.get(input.caseId);
    if (!c) {
      return createErrorResponse("NOT_FOUND", "해당 진단 건을 찾을 수 없습니다.");
    }

    if (c.extraAttemptAllowance >= DEMO_LIMITS.MAX_EXTRA_ATTEMPT_ALLOWANCE) {
      return createErrorResponse(
        "QUOTA_EXCEEDED",
        "추가 시도는 최대 2회까지만 부여할 수 있습니다.",
      );
    }

    c.extraAttemptAllowance += 1;
    c.maxEvaluatedCount += 1;
    c.canResubmit = true;
    c.caseStatus = "RETRY_REQUIRED";
    c.revisionNotice = `선생님께서 추가 시도를 허용하셨습니다: ${input.reason}`;
    c.auditHistory.push({
      revision: c.auditHistory.length + 1,
      changedAt: new Date().toISOString(),
      teacherId: this.currentSession.actorId,
      action: "EXTRA_ATTEMPT_GRANTED",
      comment: input.reason,
    });
    c.updatedAt = new Date().toISOString();

    return createSuccessResponse({
      caseId: c.caseId,
      extraAttemptAllowance: c.extraAttemptAllowance,
    });
  }

  async updateLearningSettings(input: {
    learnerId: string;
    expectedVersion: number;
    currentUnitId: string;
    prerequisites: string[];
    allowedUnits: string[];
  }): Promise<Result<{ learnerId: string; settingsVersion: number }>> {
    const student = this.students.get(input.learnerId);
    if (!student) {
      return createErrorResponse("NOT_FOUND", "학생을 찾을 수 없습니다.");
    }
    return createSuccessResponse({
      learnerId: input.learnerId,
      settingsVersion: input.expectedVersion + 1,
    });
  }

  // --- 복습 ---
  async createReviewCandidate(
    input: CreateReviewCandidateInput,
  ): Promise<Result<ReviewItemCandidateDto>> {
    const sourceCase = this.cases.get(input.sourceCaseId);
    if (!sourceCase) {
      return createErrorResponse("NOT_FOUND", "원문 케이스를 찾을 수 없습니다.");
    }

    const existingForCase = Array.from(this.reviewCandidates.values()).filter(
      (r) => r.sourceCaseId === input.sourceCaseId,
    );

    if (!canCreateReviewCandidate(sourceCase.kind, existingForCase.length)) {
      return createErrorResponse("VALIDATION_ERROR", "더 이상 복습 후보를 생성할 수 없습니다.");
    }

    const reviewId = `rev_${Date.now()}`;
    const candidate: ReviewItemCandidateDto = {
      reviewId,
      sourceCaseId: input.sourceCaseId,
      candidateIndex: existingForCase.length + 1,
      questionVersion: 1,
      status: "PENDING_APPROVAL",
      problemText: "일차방정식 4x - 6 = 2x + 8 의 해를 구하시오.",
      conceptId: sourceCase.conceptId ?? "M1_EQ_TRANSPOSE",
      difficulty: input.difficulty,
      validationStatus: "PASS",
      createdAt: new Date().toISOString(),
    };

    this.reviewCandidates.set(reviewId, candidate);
    return createSuccessResponse(candidate);
  }

  async getReviewCandidate(reviewId: string): Promise<Result<ReviewItemCandidateDto>> {
    const item = this.reviewCandidates.get(reviewId);
    if (!item) {
      return createErrorResponse("NOT_FOUND", "해당 복습 문제를 찾을 수 없습니다.");
    }
    return createSuccessResponse({ ...item });
  }

  async approveReviewItem(
    input: ApproveReviewItemInput,
  ): Promise<Result<{ reviewId: string; status: "APPROVED" | "AVAILABLE" }>> {
    const item = this.reviewCandidates.get(input.reviewId);
    if (!item) {
      return createErrorResponse("NOT_FOUND", "해당 복습 문제를 찾을 수 없습니다.");
    }

    if (item.questionVersion !== input.questionVersion) {
      return createErrorResponse("VERSION_CONFLICT", "문제 버전이 일치하지 않습니다.");
    }

    item.status = "AVAILABLE";
    return createSuccessResponse({ reviewId: item.reviewId, status: "AVAILABLE" });
  }

  async rejectReviewItem(
    input: RejectReviewItemInput,
  ): Promise<Result<{ reviewId: string; status: "REJECTED" }>> {
    const item = this.reviewCandidates.get(input.reviewId);
    if (!item) {
      return createErrorResponse("NOT_FOUND", "해당 복습 문제를 찾을 수 없습니다.");
    }

    item.status = "REJECTED";
    item.rejectionReason = input.reason;
    return createSuccessResponse({ reviewId: item.reviewId, status: "REJECTED" });
  }

  async editReviewCandidate(input: {
    reviewId: string;
    expectedVersion: number;
    problemText: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
  }): Promise<Result<{ reviewId: string; questionVersion: number }>> {
    const item = this.reviewCandidates.get(input.reviewId);
    if (!item) {
      return createErrorResponse("NOT_FOUND", "해당 복습 문제를 찾을 수 없습니다.");
    }

    if (item.questionVersion !== input.expectedVersion) {
      return createErrorResponse("VERSION_CONFLICT", "문제 버전이 일치하지 않습니다.");
    }

    item.problemText = input.problemText;
    item.difficulty = input.difficulty;
    item.questionVersion += 1;
    item.status = "PENDING_APPROVAL";
    return createSuccessResponse({
      reviewId: item.reviewId,
      questionVersion: item.questionVersion,
    });
  }

  async listStudentReviews(): Promise<Result<{ items: StudentReviewItemDto[] }>> {
    const items: StudentReviewItemDto[] = [];
    for (const r of this.reviewCandidates.values()) {
      if (r.status === "AVAILABLE" || r.status === "IN_PROGRESS" || r.status === "COMPLETED") {
        items.push({
          reviewId: r.reviewId,
          status: r.status,
          problemText: r.problemText,
          conceptId: r.conceptId,
          difficulty: r.difficulty,
        });
      }
    }
    return createSuccessResponse({ items });
  }

  async submitStudentReview(
    reviewId: string,
    workPhotoRefs: PhotoRef[],
  ): Promise<Result<{ reviewId: string; success: boolean }>> {
    const item = this.reviewCandidates.get(reviewId);
    if (!item) {
      return createErrorResponse("NOT_FOUND", "해당 복습 문제를 찾을 수 없습니다.");
    }

    item.status = "COMPLETED";
    return createSuccessResponse({ reviewId, success: true });
  }

  // --- 리포트 ---
  async requestReport(
    learnerId: string,
    fromDate: string,
    toDate: string,
  ): Promise<Result<{ reportId: string }>> {
    const reportId = `rep_${Date.now()}`;
    const student = this.students.get(learnerId);

    const draft: ReportDraftDto = {
      reportId,
      learnerId,
      learnerName: student?.session.name || "학생",
      status: "DRAFT",
      fromDate,
      toDate,
      reportVersion: 1,
      teacherComment: "이항과 부호 정리에 유의하여 차근차근 식을 정리하는 연습이 진행 중입니다.",
      homeQuestions: ["가정에서 이항할 때 부호 변경 원리를 함께 확인해 주세요."],
      metricsSummary: {
        totalOriginalProblems: 2,
        initialAccuracyPercent: 50.0,
        retrySuccessRatePercent: 100.0,
        vulnerableConcepts: ["이항"],
        maxHintUsageLevel: 1,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.reports.set(reportId, draft);
    return createSuccessResponse({ reportId });
  }

  async listReports(
    learnerId?: string,
  ): Promise<Result<{ drafts: ReportDraftDto[]; published: ParentPublishedReportDto[] }>> {
    const drafts: ReportDraftDto[] = [];
    const published: ParentPublishedReportDto[] = [];

    for (const r of this.reports.values()) {
      if (learnerId && r.learnerId !== learnerId) continue;
      if (r.status === "PUBLISHED") {
        published.push({
          reportId: r.reportId,
          learnerId: r.learnerId,
          learnerName: r.learnerName,
          status: "PUBLISHED",
          fromDate: r.fromDate,
          toDate: r.toDate,
          teacherComment: r.teacherComment,
          homeQuestions: r.homeQuestions,
          metricsSummary: r.metricsSummary,
          publishedAt: r.updatedAt,
        });
      } else {
        drafts.push({ ...r });
      }
    }

    return createSuccessResponse({ drafts, published });
  }

  async getReportDraft(reportId: string): Promise<Result<ReportDraftDto>> {
    const r = this.reports.get(reportId);
    if (!r) {
      return createErrorResponse("NOT_FOUND", "해당 리포트를 찾을 수 없습니다.");
    }
    return createSuccessResponse({ ...r });
  }

  async getPublishedReport(reportId: string): Promise<Result<ParentPublishedReportDto>> {
    const r = this.reports.get(reportId);
    if (!r || r.status !== "PUBLISHED") {
      return createErrorResponse("NOT_FOUND", "발행된 리포트가 존재하지 않거나 회수되었습니다.");
    }

    return createSuccessResponse({
      reportId: r.reportId,
      learnerId: r.learnerId,
      learnerName: r.learnerName,
      status: "PUBLISHED",
      fromDate: r.fromDate,
      toDate: r.toDate,
      teacherComment: r.teacherComment,
      homeQuestions: r.homeQuestions,
      metricsSummary: r.metricsSummary,
      publishedAt: r.updatedAt,
    });
  }

  async saveReportDraft(
    input: SaveReportDraftInput,
  ): Promise<Result<{ reportId: string; reportVersion: number }>> {
    const r = this.reports.get(input.reportId);
    if (!r) {
      return createErrorResponse("NOT_FOUND", "해당 리포트를 찾을 수 없습니다.");
    }

    r.teacherComment = input.teacherComment;
    r.homeQuestions = input.homeQuestions;
    r.reportVersion += 1;
    r.updatedAt = new Date().toISOString();

    return createSuccessResponse({ reportId: r.reportId, reportVersion: r.reportVersion });
  }

  async publishReport(
    input: PublishReportInput,
  ): Promise<Result<{ reportId: string; status: "PUBLISHED" }>> {
    const r = this.reports.get(input.reportId);
    if (!r) {
      return createErrorResponse("NOT_FOUND", "해당 리포트를 찾을 수 없습니다.");
    }

    if (!canPublishReport(r.status, r.teacherComment, r.homeQuestions)) {
      return createErrorResponse(
        "VALIDATION_ERROR",
        "총평 20자 이상 및 가정 연계 질문 1개 이상이 필요합니다.",
      );
    }

    r.status = "PUBLISHED";
    r.updatedAt = new Date().toISOString();

    return createSuccessResponse({ reportId: r.reportId, status: "PUBLISHED" });
  }

  async withdrawReport(
    input: WithdrawReportInput,
  ): Promise<Result<{ reportId: string; status: "WITHDRAWN" }>> {
    const r = this.reports.get(input.reportId);
    if (!r) {
      return createErrorResponse("NOT_FOUND", "해당 리포트를 찾을 수 없습니다.");
    }

    if (!canWithdrawReport(r.status)) {
      return createErrorResponse("VALIDATION_ERROR", "발행된 리포트만 회수할 수 있습니다.");
    }

    r.status = "WITHDRAWN";
    r.updatedAt = new Date().toISOString();

    return createSuccessResponse({ reportId: r.reportId, status: "WITHDRAWN" });
  }

  // --- 관리자 및 데모 제어 ---
  async getAdminSettings(): Promise<Result<AdminSettingsDto>> {
    const accounts = [
      ...Array.from(this.students.values()).map((s) => ({
        actorId: s.session.actorId,
        role: s.session.role,
        name: s.session.name,
        status: s.session.accountStatus,
      })),
      ...Array.from(this.teachers.values()).map((t) => ({
        actorId: t.session.actorId,
        role: t.session.role,
        name: t.session.name,
        status: t.session.accountStatus,
      })),
      ...Array.from(this.parents.values()).map((p) => ({
        actorId: p.session.actorId,
        role: p.session.role,
        name: p.session.name,
        status: p.session.accountStatus,
      })),
      {
        actorId: this.admin.session.actorId,
        role: this.admin.session.role,
        name: this.admin.session.name,
        status: this.admin.session.accountStatus,
      },
    ];

    return createSuccessResponse({
      demoMode: true,
      scenario: "DEFAULT",
      accounts,
      relations: [],
      parentRelations: [],
      aiAutoReleaseEnabled: this.aiConfig.aiReleaseEnabled,
      version: 1,
    });
  }

  async createAccount(
    input: CreateAccountInput,
  ): Promise<Result<{ actorId: string; tempPassword?: string }>> {
    const existingNos: string[] = [];
    for (const s of this.students.values()) {
      if (s.session.loginId) existingNos.push(s.session.loginId);
    }
    const valRes = validateInternalNo(input.internalNo, existingNos);
    if (!valRes.valid) {
      return createErrorResponse("VALIDATION_ERROR", valRes.reason || "관리번호 오류");
    }

    const tempPassword = generateTemporaryPassword();
    const actorId = `usr_${input.role.toLowerCase()}_${Date.now().toString(36)}`;

    if (input.role === "STUDENT") {
      this.students.set(actorId, {
        session: {
          actorId,
          name: input.name,
          role: "STUDENT",
          accountStatus: "ACTIVE",
          loginId: input.internalNo,
          gradeLevel: input.gradeLevel || 1,
          availableLearners: [],
          mustChangePassword: true,
          consents: {
            serviceTerms: true,
            privacyPolicy: true,
            parentalConsent: true,
            consentVersion: "v1.0",
          },
        },
        assignedTeacherId: "usr_teacher_01",
        cases: [],
      });
    }

    return createSuccessResponse({ actorId, tempPassword });
  }

  async updateAccountStatus(
    input: UpdateAccountStatusInput,
  ): Promise<Result<{ actorId: string; status: AccountStatus }>> {
    // 학생
    const s = this.students.get(input.actorId);
    if (s) {
      s.session.accountStatus = input.status;
      return createSuccessResponse({ actorId: input.actorId, status: input.status });
    }
    // 교사
    const t = this.teachers.get(input.actorId);
    if (t) {
      t.session.accountStatus = input.status;
      return createSuccessResponse({ actorId: input.actorId, status: input.status });
    }
    // 학부모
    const p = this.parents.get(input.actorId);
    if (p) {
      p.session.accountStatus = input.status;
      return createSuccessResponse({ actorId: input.actorId, status: input.status });
    }

    return createErrorResponse("NOT_FOUND", "해당 계정을 찾을 수 없습니다.");
  }

  async assignRelations(
    input: AssignRelationsInput,
  ): Promise<Result<{ learnerId: string; success: true }>> {
    const tRes = validateTeacherAssignmentCount(input.teacherIds.length);
    if (!tRes.valid) return createErrorResponse("VALIDATION_ERROR", tRes.reason || "교사 수 초과");

    const pRes = validateParentAssignmentCount(input.parentIds.length);
    if (!pRes.valid)
      return createErrorResponse("VALIDATION_ERROR", pRes.reason || "보호자 수 초과");

    // 교사 매핑 업데이트
    for (const [tId, t] of this.teachers.entries()) {
      if (input.teacherIds.includes(tId)) {
        if (!t.assignedStudentIds.includes(input.learnerId)) {
          t.assignedStudentIds.push(input.learnerId);
        }
      } else {
        t.assignedStudentIds = t.assignedStudentIds.filter((id) => id !== input.learnerId);
      }
    }

    // 학부모 매핑 업데이트
    for (const [pId, p] of this.parents.entries()) {
      if (input.parentIds.includes(pId)) {
        if (!p.childrenStudentIds.includes(input.learnerId)) {
          p.childrenStudentIds.push(input.learnerId);
        }
      } else {
        p.childrenStudentIds = p.childrenStudentIds.filter((id) => id !== input.learnerId);
      }
    }

    return createSuccessResponse({ learnerId: input.learnerId, success: true });
  }

  async listConsents(): Promise<Result<{ items: ConsentRecordDto[] }>> {
    return createSuccessResponse({ items: Array.from(this.consents.values()) });
  }

  async listDeletionRequests(): Promise<Result<{ items: DeletionRequestDto[] }>> {
    return createSuccessResponse({ items: Array.from(this.deletionRequests.values()) });
  }

  async requestDeletion(
    actorId: string,
    reason: string,
  ): Promise<Result<{ requestId: string; status: DeletionRequestStatus }>> {
    const requestId = `del_${Date.now().toString(36)}`;
    const student = this.students.get(actorId);
    const req: DeletionRequestDto = {
      requestId,
      actorId,
      actorName: student?.session.name || "사용자",
      role: student?.session.role || "STUDENT",
      reason,
      status: "REQUESTED",
      requestedAt: new Date().toISOString(),
    };
    this.deletionRequests.set(requestId, req);
    return createSuccessResponse({ requestId, status: "REQUESTED" });
  }

  async stepDeletionDemo(
    requestId: string,
  ): Promise<Result<{ requestId: string; status: DeletionRequestStatus }>> {
    const req = this.deletionRequests.get(requestId);
    if (!req) return createErrorResponse("NOT_FOUND", "삭제 요청을 찾을 수 없습니다.");

    // 순차 상태 전이: REQUESTED -> BLOCKED -> PURGING -> COMPLETED
    if (req.status === "REQUESTED") {
      req.status = "BLOCKED";
      // 접근 차단: 계정 SUSPENDED
      const s = this.students.get(req.actorId);
      if (s) s.session.accountStatus = "SUSPENDED";
    } else if (req.status === "BLOCKED") {
      req.status = "PURGING";
    } else if (req.status === "PURGING") {
      req.status = "COMPLETED";
      req.processedAt = new Date().toISOString();
    }

    return createSuccessResponse({ requestId: req.requestId, status: req.status });
  }

  async getAiOperationsConfig(): Promise<Result<AiOperationConfigDto>> {
    return createSuccessResponse({ ...this.aiConfig });
  }

  async updateAiReleaseToggle(enabled: boolean): Promise<Result<{ aiReleaseEnabled: boolean }>> {
    this.aiConfig.aiReleaseEnabled = enabled;
    return createSuccessResponse({ aiReleaseEnabled: enabled });
  }

  async listCorrectionRules(): Promise<Result<{ items: CorrectionRuleDto[] }>> {
    return createSuccessResponse({ items: Array.from(this.correctionRules.values()) });
  }

  async createCorrectionRule(
    input: CreateCorrectionRuleInput,
  ): Promise<Result<{ ruleId: string }>> {
    const ruleId = `rule_${Date.now().toString(36)}`;
    const newRule: CorrectionRuleDto = {
      ruleId,
      ruleTitle: input.ruleTitle,
      conceptId: input.conceptId,
      errorType: input.errorType,
      appliesWhen: input.appliesWhen,
      correctionPrinciple: input.correctionPrinciple,
      counterExamples: input.counterExamples,
      syntheticExamples: [],
      version: 1,
      status: "DRAFT",
      privacyCheckPassed: true,
      regressionEvalStatus: "PASS",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.correctionRules.set(ruleId, newRule);
    return createSuccessResponse({ ruleId });
  }

  async approveCorrectionRule(
    ruleId: string,
  ): Promise<Result<{ ruleId: string; status: "APPROVED" }>> {
    const rule = this.correctionRules.get(ruleId);
    if (!rule) return createErrorResponse("NOT_FOUND", "교정 규칙을 찾을 수 없습니다.");

    const valRes = canApproveCorrectionRule(rule);
    if (!valRes.valid) return createErrorResponse("VALIDATION_ERROR", valRes.reason || "승인 불가");

    rule.status = "APPROVED";
    rule.updatedAt = new Date().toISOString();
    return createSuccessResponse({ ruleId, status: "APPROVED" });
  }

  async resetDemoData(): Promise<Result<{ success: true }>> {
    this.resetToFixtures();
    return createSuccessResponse({ success: true });
  }

  async setDemoScenario(scenarioId: string): Promise<Result<{ success: true }>> {
    return createSuccessResponse({ success: true });
  }
}
