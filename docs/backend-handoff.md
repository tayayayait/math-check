# 수학 손글씨 풀이 AI 진단 웹 서비스 - Supabase 백엔드 인계 가이드 (Backend Handoff)

본 문서는 **수학 손글씨 풀이 AI 진단 웹 서비스**의 프론트엔드 프로토타입 구현물을 Supabase 기반의 실제 백엔드 시스템으로 전환하고 연동하기 위한 상세 인계 규격서입니다.

---

## 1. 개요 및 인계 원칙

- **인터페이스 기반 분리**: 프론트엔드는 `IAppRepository`(`src/contracts/repository.ts`) 인터페이스를 통해서만 데이터에 접근하므로, 백엔드 개발 시 Supabase 전용 구현체(`SupabaseRepository`)를 작성하여 `DataProvider`에 주입하면 UI 코드의 수정 없이 즉시 실 서비스로 전환 가능합니다.
- **안티 패턴 차단 (UI 직결 금지)**: UI 컴포넌트 내부에서 Supabase 클라이언트 SDK(`supabase.from('cases').select(...)`)를 직접 호출하는 방식은 허용되지 않으며, 반드시 도메인 검증 및 Public DTO 변환을 거치는 Repository 레이어를 유지해야 합니다.
- **최소 권한 및 Public DTO 격리**: 학생과 학부모에게는 미공개 힌트, 기준 정답 수식, 독립 풀이 검증 데이터, 교사 내부 메모가 절대 노출되어서는 안 되며, RLS(Row Level Security)와 Edge Function 레벨에서 원천 필터링되어야 합니다.

---

## 2. 레포지토리 인터페이스 계약 (`IAppRepository`)

### 2.1 인증 및 세션
| 메서드 명칭 | 입력 파라미터 | 반환 타입 (`Result<T>`) | 주요 에러 코드 | 백엔드 구현 요건 |
|:---|:---|:---|:---|:---|
| `login` | `LoginInput` (`loginId`, `password`) | `DemoSessionDto` | `INVALID_CREDENTIALS`, `ACCOUNT_DISABLED` | Supabase Auth `signInWithPassword` 연동, 비밀번호 변경 필요 여부 확인 |
| `getCurrentSession` | 없음 | `DemoSessionDto` | `AUTH_EXPIRED` | Supabase Auth 토큰 파싱 및 프로필/권한 조합 |
| `changePassword` | `ChangePasswordInput` | `{ success: boolean }` | `VALIDATION_ERROR` | Supabase Auth `updateUser({ password })` |
| `setDemoSession` | `actorId: string` | `DemoSessionDto` | `NOT_FOUND` | **(데모 전용)** 실제 운영 배포 시 비활성화 |

### 2.2 학생 학습 흐름
| 메서드 명칭 | 입력 파라미터 | 반환 타입 (`Result<T>`) | 주요 에러 코드 | 백엔드 구현 요건 |
|:---|:---|:---|:---|:---|
| `listStudentCases` | 없음 | `StudentCaseListItemDto[]` | `AUTH_EXPIRED` | 본인(`learnerId = auth.uid()`)의 케이스만 RLS로 조회 |
| `getStudentCase` | `caseId: string` | `StudentCaseDto` | `NOT_FOUND`, `FORBIDDEN` | 비공개 필드 제거, 본인 케이스만 접근 허용 |
| `createSubmission` | `CreateSubmissionInput` | `{ caseId, attemptId, version }` | `VALIDATION_ERROR`, `IDEMPOTENCY_CONFLICT` | 사진 Storage 업로드 세션 생성, 멱등키 검증, 비동기 AI 진단 큐 등록 |
| `revealHint` | `RevealHintInput` (`attemptId`, `level`, `resultVersion`) | `{ revealedLevel, hint, resultVersion }` | `VERSION_CONFLICT`, `VALIDATION_ERROR` | 힌트 순서(1→2→3) 검증, 이미 열린 힌트는 멱등 반환, 상위 힌트 비공개 |
| `createRetry` | `CreateRetryInput` | `{ caseId, attemptId, version }` | `QUOTA_EXCEEDED`, `VERSION_CONFLICT` | 시도 횟수 한도(기본 4회 + 교사 추가 부여) 원자적 검증 및 갱신 |
| `requestHelp` | `RequestHelpInput` | `{ caseId, helpRequested }` | `NOT_FOUND` | `helpRequested = true` 설정 및 교사 검수 큐 우선순위 등록 |
| `listStudentReviews` | 없음 | `{ items: StudentReviewItemDto[] }` | `AUTH_EXPIRED` | 원문이 종결(`RESOLVED`/`TEACHER_CLOSED`)되고 교사가 승인한 문항만 노출 |

### 2.3 교사 검수 및 대시보드
| 메서드 명칭 | 입력 파라미터 | 반환 타입 (`Result<T>`) | 주요 에러 코드 | 백엔드 구현 요건 |
|:---|:---|:---|:---|:---|
| `getTeacherDashboard` | `range: "7d" \| "30d" \| "90d"` | `TeacherDashboardMetricsDto` | `FORBIDDEN` | 담당 학생의 4대 지표(교사 확인, 설명 필요, 재풀이 대기, 취약 개념) 집계 |
| `listTeacherReviewQueue` | `TeacherReviewQueueFilterDto` | `TeacherReviewQueueItemDto[]` | `FORBIDDEN` | 우선순위(도움요청 0, 불일치 1, 재풀이 3) 정렬 및 커서 기반 페이징 |
| `getTeacherCase` | `caseId: string` | `TeacherCaseDto` | `NOT_FOUND`, `FORBIDDEN` | 정답 수식, 모델 A/B/C 비교 결과, 내부 메모 포함 전체 데이터 반환 |
| `saveTeacherReview` | `SaveTeacherReviewInput` | `{ caseId, version }` | `VERSION_CONFLICT`, `VALIDATION_ERROR` | `expectedVersion` 낙관적 락 검증, 판정 정정 및 힌트 수정 이력 저장 |
| `grantExtraAttempt` | `GrantExtraAttemptInput` | `{ caseId, remainingExtra }` | `LIMIT_EXCEEDED`, `VERSION_CONFLICT` | 추가 기회 최대 2회 한도 내에서 1회씩 부여, 사유 필수 기록 |
| `closeByTeacher` | `CloseByTeacherInput` | `{ caseId, caseStatus }` | `VALIDATION_ERROR` | 지도 설명(20자 이상) 기록 후 `TEACHER_CLOSED` 상태로 완결 |

### 2.4 복습 관리 및 학부모 리포트
| 메서드 명칭 | 입력 파라미터 | 반환 타입 (`Result<T>`) | 주요 에러 코드 | 백엔드 구현 요건 |
|:---|:---|:---|:---|:---|
| `approveReviewItem` | `ApproveReviewItemInput` | `{ reviewId, status }` | `VALIDATION_ERROR` | 8대 품질 기준 전 항목 통과 여부 검증 후 `APPROVED` 전이 |
| `rejectReviewItem` | `RejectReviewItemInput` | `{ reviewId, status }` | `VALIDATION_ERROR` | 반려 사유(10자 이상) 필수 기록 후 `REJECTED` 전이 |
| `saveReportDraft` | `SaveReportDraftInput` | `{ reportId, version }` | `VERSION_CONFLICT` | 교사 의견 및 가정 지도 질문 초안 임시 저장 |
| `publishReport` | `PublishReportInput` | `ParentPublishedReportDto` | `VERSION_CONFLICT`, `IDEMPOTENCY_CONFLICT` | 불변 스냅샷 생성, 학부모 공개 등록, 멱등키 보장 |
| `withdrawReport` | `WithdrawReportInput` | `{ reportId, status }` | `NOT_FOUND` | 발행 취소 및 학부모 화면 비공개 처리 (회수 사유 기록) |
| `getPublishedReport` | `reportId: string` | `ParentPublishedReportDto` | `NOT_FOUND`, `FORBIDDEN` | 연결된 학부모만 조회 가능, 사진 원본/정답 수식 제외 |

---

## 3. 동시성 제어 및 버전 관리 전략

### 3.1 낙관적 동시성 제어 (Optimistic Locking)
- 모든 수정 요청(`saveTeacherReview`, `createRetry`, `saveReportDraft` 등)에는 반드시 `expectedVersion` 또는 `resultVersion`이 포함됩니다.
- 백엔드 SQL 트랜잭션 예시:
  ```sql
  UPDATE diagnosis_cases
  SET result_version = result_version + 1,
      verdict = $1,
      updated_at = NOW()
  WHERE case_id = $2 AND result_version = $3;
  
  -- 영향받은 행 수가 0이면 즉시 VERSION_CONFLICT 에러 반환
  ```

### 3.2 멱등성 (Idempotency) 보장
- 중복 네트워크 요청 및 재시도 방지를 위해 `idempotencyKey`를 지원합니다.
- 백엔드는 별도의 `idempotency_cache` 테이블 또는 Redis 캐시를 두어, 동일 키로 재요청 시 기존 성공 응답을 그대로 반환합니다.

---

## 4. 데이터베이스 및 스키마 설계 권장안

### 4.1 핵심 테이블 구성
1. `profiles`: 사용자 기본 정보 (ID, 실명, 역할 `STUDENT | TEACHER | PARENT | ADMIN`, 계정 상태)
2. `student_teacher_relations`: 학생과 담당 교사 간 매핑 (학생당 최대 4명)
3. `student_parent_relations`: 학생과 학부모 간 매핑 (학생당 최대 2명)
4. `diagnosis_cases`: 진단 건 마스터 (교재, 쪽수, 문제번호, 상태, 최종 판정, 버전)
5. `case_attempts`: 시도 이력 (시도 순번 1~5, 풀이 사진 참조, 인식 줄, 진단 결과)
6. `revealed_hints`: 공개된 힌트 이력 (학생별, 시도별, 레벨 1~3, 공개 시각)
7. `review_items`: 맞춤 복습 문항 후보 및 승인 데이터 (8대 체크리스트 결과)
8. `learning_reports`: 학부모 리포트 스냅샷 및 발행 상태 (초안, 발행, 회수)
9. `consents`: 개인정보 및 AI 처리 동의 증빙 (법정대리인 확인 정보)

### 4.2 Row Level Security (RLS) 정책 요건
- **학생 (`STUDENT`)**: 본인의 `diagnosis_cases`, `revealed_hints`, 승인 완료된 `review_items`만 SELECT/INSERT 가능.
- **교사 (`TEACHER`)**: 본인에게 배정된 학생의 케이스 및 검수 큐 전체 조회/수정 가능.
- **학부모 (`PARENT`)**: 연결된 자녀의 공식 발행(`PUBLISHED`) 리포트만 SELECT 가능.
- **원장/대표 (`ADMIN`)**: 전체 계정, 배정 관계, 시스템 운영 설정, 동의 증빙 전체 관리 가능.

---

## 5. 후속 백엔드 구축 로드맵 (B1 ~ B8)

| 단계 | 작업 영역 | 주요 구현 과제 |
|:---:|:---|:---|
| **B1** | Supabase Auth 및 사용자 관리 | 실제 전화번호/ID 기반 인증, 초기 비밀번호 강제 변경, 담당 교사/학부모 관계 RLS 구축 |
| **B2** | 스키마 정규화 및 RLS 강화 | 테이블 분리(Public 뷰 vs Private 테이블), 감사 로그 트리거, SQL 함수(RPC) 작성 |
| **B3** | Storage 버킷 및 비공개 업로드 | Private 버킷 구성, 단기 Signed URL 발급, EXIF/위치 메타데이터 제거 및 JPEG/WebP 변환 |
| **B4** | 비동기 분석 작업 큐 (Queue) | Supabase pgmq 또는 Redis 기반 진단 큐 구축, AI 응답 지연 시 웹훅/폴링 처리 |
| **B5** | 실제 OCR 및 AI 진단 파이프라인 | Mathpix/GPT-4o 등 실제 비전 모델 연동, 3개 모델 앙상블 및 안전성 필터링 게이트 적용 |
| **B6** | 복습 생성 및 리포트 엔진 | 오류 개념 기반 유사 문항 프롬프트 템플릿 실행, 불변 리포트 스냅샷 생성 RPC 구현 |
| **B7** | 개인정보 보관 주기 및 삭제 배치 | 사진 90일 만료 파기 cron 배치, 삭제 요청 시 가명화/영구 삭제 트랜잭션 구현 |
| **B8** | 실환경 파일럿 및 부하 테스트 | 90건 이상의 실제 학생 손글씨 데이터셋 검증, 동시 접속 부하 및 네트워크 지연 테스트 |
