# 수학 손글씨 풀이 AI 진단 웹 서비스 - 프로토타입 시나리오 검증서

본 문서는 **수학 손글씨 풀이 AI 진단 웹 서비스**의 프론트엔드 프로토타입에 정의된 19대 핵심 시나리오(D01~D19)와 전체 사용자 역할별 E2E 라이프사이클의 구현 내용 및 검증 결과를 기술합니다.

---

## 1. 개요 및 비즈니스 라이프사이클

본 프로토타입은 학생의 손글씨 수학 풀이를 AI가 단계별로 진단하고, 안전하게 힌트를 제공하며, 교사의 검수와 맞춤형 복습 생성, 학부모 리포트 발행 및 원장의 운영 정책 관리까지 완결된 풀사이클을 지원합니다.

```
[학생 문제/풀이 제출] 
        ↓
[AI 1차 진단 및 안전 판정] 
        ↓
[1/2/3단계 순차 힌트 열람 & 재풀이 (최대 4회)]
        ↓
[교사 검수 대시보드 / 진단 결과 정정 및 직접 지도]
        ↓
[맞춤 복습 문항 후보 검수 및 8대 기준 승인]
        ↓
[학생 복습 풀이 수행 & 완료]
        ↓
[학부모 리포트 요청 → 교사 초안 작성 & 공식 발행]
        ↓
[학부모 리포트 열람 및 A4 인쇄 / 필요 시 교사 회수]
        ↓
[원장/관리자 운영 설정: 계정, 동의 증빙, AI 예산 및 교정 규칙 관리]
```

---

## 2. 핵심 시나리오 정의 및 검증 결과 (D01 ~ D19)

| 시나리오 ID | 시나리오 명칭 | 핵심 입력 및 행동 조건 | 기대 동작 및 시스템 검증 결과 | 관련 검증 테스트 |
|:---|:---|:---|:---|:---|
| **D01** | 안전 오답 접수 및 순차 힌트 열람 | 중1 일차방정식 오답 제출 후 진단 결과 페이지에서 1단계 힌트 확인 후 2단계 요청 | `evaluatedCount: 1`, 초기에는 1단계 힌트만 노출되며, 2단계 요청 시 `revealedHints`가 2개로 순차 확장됨 | `src/test/prototype-scenarios.test.ts`, `src/test/student-case.test.tsx` |
| **D02** | 힌트 단계 건너뛰기 차단 | 1단계만 확인한 상태에서 3단계 힌트 직접 요청 또는 조작 시도 | 도메인 정책 `validateHintRequest` 및 레포지토리 `revealHint`에서 `VALIDATION_ERROR`("이전 단계 힌트를 먼저 확인해야 합니다.")로 차단됨 | `src/test/prototype-scenarios.test.ts`, `src/test/hint-policy.test.ts` |
| **D03** | 재풀이 평가 한도 도달 및 차단 | 정상 재풀이 4회(기본 한도) 시도 모두 오답 발생 | 4회째 제출 완료 시 케이스 상태가 `WAITING_TEACHER`로 전이되며, `canResubmit`이 `false`가 되어 추가 재풀이 시도 시 `QUOTA_EXCEEDED` 에러로 차단됨 | `src/test/prototype-scenarios.test.ts`, `src/test/case-policy.test.ts` |
| **D04** | 교사 추가 재풀이 기회 부여 한도 | 4회 소진 케이스에 대해 교사가 추가 기회 부여 시도 | 1회씩 사유 입력과 함께 최대 2회까지만 허용되며, 3번째 추가 부여 시도는 도메인 정책에서 거절됨 | `src/test/teacher-review-policy.test.ts` |
| **D05** | 판독 불가 사진 교체 및 분석 재시도 | AI 판독 불가(`UNREADABLE`) 또는 사진 손상 판정 시 사진 재촬영/교체 | 동일 attempt 내에서 `inputRevision`이 증가하고 새 job이 생성되며, 이전 판독 불가는 시도 횟수(`evaluatedCount`)에서 차감되지 않음 | `src/test/case-policy.test.ts`, `src/test/photo-policy.test.ts` |
| **D06** | 입력 수정 중 이전 job 완료 폐기 | 입력 사진/줄을 수정한 뒤 뒤늦게 이전 분석 job 결과가 도착하는 경우 | `resultVersion` 불일치로 인해 이전 결과는 즉시 폐기(STALE 처리)되고 최신 수정본의 상태가 온전하게 보존됨 | `src/test/case-policy.test.ts` |
| **D07** | 선생님 질문(도움 요청) 중 힌트 동결 | 학생이 "선생님께 확인 요청"을 클릭하여 도움을 요청한 상태 | `helpRequested: true`로 전이되며 교사 검수 완료 전까지 추가 힌트 열람 및 신규 재풀이가 동결 처리됨 | `src/test/hint-policy.test.ts`, `src/test/student-case.test.tsx` |
| **D08** | 교사 간 동시 수정 버전 충돌 방지 | 두 명의 교사가 동일한 `expectedVersion`을 기반으로 동시에 검수 저장 시도 | 첫 번째 교사의 저장은 성공하며 버전이 증가하고, 두 번째 교사는 `VERSION_CONFLICT` 에러를 수신하며 작성 중인 폼 내용이 보존된 채 최신 비교 화면이 제공됨 | `src/test/teacher-review-policy.test.ts` |
| **D09** | AI/휴먼 불일치 시 단순 판정 변경 차단 | AI 2개 모델 간 판단이 불일치(`ANSWER_MISMATCH`)한 케이스에 대해 단순 라디오 버튼 변경으로 자동 공개 시도 | 단순 라디오 수정만으로는 학생 자동 공개가 불가하며, 교사의 명시적 비교 검수 사유(`TEACHER_EXACT`) 또는 `직접 지도 완료` 처리가 필수 요구됨 | `src/test/teacher-review-policy.test.ts` |
| **D10** | 복습 후보 승인 및 원문 완료 게이트 | 복습 문항 후보가 승인되었으나 원문 케이스가 아직 미완료인 상태 | 상태는 `APPROVED`이지만 학생에게는 아직 노출되지 않으며, 원문 케이스가 `RESOLVED` 또는 `TEACHER_CLOSED`로 종결되는 즉시 학생 맞춤 복습 목록에 `AVAILABLE`로 노출됨 | `src/test/review-policy.test.ts`, `src/test/review-flow.test.tsx` |
| **D11** | 학생 복습 시작 후 문항 수정 차단 | 학생이 복습 풀이를 시작(`IN_PROGRESS`)한 이후 교사가 해당 문항을 수정하거나 원문을 정정하는 경우 | 기존에 학생이 제출 중이던 버전과 시도 이력은 보존되며, 수정본으로 인한 불일치를 방지하기 위해 신규 제출을 잠시 차단하고 교사 확인 상태로 유도함 | `src/test/review-policy.test.ts` |
| **D12** | 학부모 중복 요청 방지 및 스냅샷 불변성 | 학부모가 동일 기간에 대해 중복 리포트 요청을 보내거나, 발행된 리포트의 원문 데이터가 변경된 경우 | 동일 기간 중복 요청은 기존 요청 건으로 반환되며, 발행된 리포트는 불변 스냅샷(`immutable snapshot`)으로 고정되어 이후 원문 판정 변경 시 자동 갱신되지 않고 안전하게 회수 처리됨 | `src/test/report-policy.test.ts`, `src/test/report-flow.test.tsx` |
| **D13** | 타인 자원 및 권한 없는 URL 접근 차단 | 학생 A가 학생 B의 케이스 URL 직접 접근, 또는 학생이 교사/관리자 전용 URL 접근 시도 | 레포지토리에서는 `FORBIDDEN`을 반환하며, 라우팅 가드에서는 Not Found(404) 또는 접근 차단 화면을 렌더링하여 데이터 누출을 원천 방지함 | `src/test/public-dto.test.ts`, `src/test/app-routing.test.tsx` |
| **D14** | 동의 철회 및 삭제 요청 시 접근 차단 | 학부모의 정보 제공 동의 철회 또는 개인정보 삭제 요청 접수 시 | 즉시 해당 학생에 대한 제출/힌트/리포트 조회가 차단(`BLOCKED`)되며 캐시가 정리되고 모의 데모 상태로 안전하게 안내됨 | `src/test/admin-policy.test.ts`, `src/test/admin-settings-flow.test.tsx` |
| **D15** | 필터 0건, 초기 오류, Stale 상태 구분 | 대시보드 및 목록에서 검색 결과 0건, 서비스 에러, 캐시된 데이터(Stale) 표시 | 빈 목록(`EmptyState`), 초기 로딩 실패(`ErrorState`), 재조회 실패 시 기존 캐시 유지 + `Stale 배지`가 각각 명확하게 구분되어 UI에 표현됨 | `src/test/teacher-flow.test.tsx`, `src/test/data-provider.test.tsx` |
| **D16** | 통계 분모 0 처리 및 다중 시도 케이스 집계 | 제출 수가 0건이거나 1개 문제에 4회 시도한 케이스의 지표 집계 | 정답률/완료율 분모가 0일 경우 NaN 대신 `—`로 안전 표시되며, 다중 시도 케이스는 원문 문제 수 1개로 정확하게 합산 집계됨 | `src/test/metrics.test.ts`, `src/test/report-flow.test.tsx` |
| **D17** | 손글씨 사진 회전/크롭/마스킹 편집 무결성 | 문제 및 풀이 사진 등록 시 회전, 영역 자르기, 개인정보 마스킹 편집 수행 후 취소 및 적용 | 취소 시 원본 상태로 복귀하며, 적용 시 최종 렌더링 픽셀 좌표계 기준으로 정규화되어 정제 이미지가 생성됨 | `src/test/photo-policy.test.ts`, `src/test/submission-flow.test.tsx` |
| **D18** | 학부모 리포트 A4 규격 인쇄 대응 | 학부모 리포트 상세 페이지에서 인쇄 버튼 클릭 (`window.print()`) | 전용 인쇄 스타일시트(`report-print.css`)가 적용되어 상단 헤더/네비게이션/버튼이 제거되고, A4 세로 16mm 여백과 페이지 나눔 방지(`break-inside: avoid`)가 적용됨 | `src/test/report-flow.test.tsx` |
| **D19** | 미지원 단원/개념의 AI 자동 확정 차단 | AI 지원 단원이 아니거나(`MANUAL_ONLY`), 미지원 개념인 경우 학생 제출 접수 | AI가 자동으로 정답/힌트를 확정하지 않고 교사 검수 대기(`WAITING_TEACHER`) 상태로 전환하여 안전성을 보장함 | `src/test/admin-policy.test.ts`, `src/test/case-policy.test.ts` |

---

## 3. 사용자 역할별 핵심 E2E 검증 시나리오

### 3.1 학생 시나리오 (Student Flow)
1. **제출 위저드 (`/student/submit`)**:
   - 문제 사진 1장, 풀이 사진 1장 등록 (회전, 자르기, 마스킹 편집 도구 지원).
   - 교재명, 쪽수, 문항 번호 입력.
   - 본인 작성 서약 및 개인정보 미포함 확인 체크박스 2종 필수 선택 후 제출.
2. **진단 결과 및 힌트 (`/student/cases/$caseId`)**:
   - 오답 판정 시 오류 줄 하이라이트 및 안내 메시지 확인.
   - 1단계 힌트 확인 후 2단계 힌트 순차 열람 (순서 건너뛰기 불가).
   - "선생님께 확인 요청" 클릭 시 즉시 질문 모드로 전환되며 추가 힌트 동결.
3. **재풀이 위저드 (`/student/cases/$caseId/retry`)**:
   - 기존 문제 정보가 고정된 상태에서 새로운 풀이 사진 업로드 후 재제출.
   - 최대 4회 시도 초과 시 제출 버튼 비활성화 및 교사 확인 안내.
4. **맞춤 복습 풀이 (`/student/reviews/$reviewId`)**:
   - 교사가 승인한 맞춤형 유사 문제 풀이 수행 및 단계별 풀이 제출.

### 3.2 교사 시나리오 (Teacher Flow)
1. **대시보드 (`/teacher`)**:
   - 최근 7/30/90일 기준 4대 지표(교사 확인 필요 건수, 설명 필요, 재풀이 대기, 반복 취약 개념) 실시간 집계 카드 제공.
2. **검수 큐 (`/teacher/review-queue`)**:
   - 우선순위(도움 요청 0순위, 모델 불일치 1순위 등) 정렬 및 필터링.
3. **진단 검수 상세 (`/teacher/cases/$caseId`)**:
   - 학생 제출본(원본/정제 사진, 인식 텍스트)과 AI 진단 결과 대조.
   - 교사 판정 정정, 오류 위치/유형 지정, 힌트 문구 수정, 내부 메모 작성.
   - 결과 버전 충돌 방지 및 감사 이력 기록.
4. **복습 문항 승인 (`/teacher/reviews/$reviewId`)**:
   - AI 생성 맞춤 문항의 8대 품질 기준 체크리스트(조건 충분, 유일해, 답 미누출 등) 검수 후 정식 승인.
5. **학부모 리포트 작성 (`/teacher/reports/$reportId`)**:
   - 기간 내 학생의 학습 지표 스냅샷 확인, 총평 및 가정 지도 질문 작성 후 정식 발행.

### 3.3 학부모 시나리오 (Parent Flow)
1. **학부모 홈 (`/parent`)**:
   - 연결된 자녀 선택 및 7일/30일/직접 지정 기간 리포트 요청.
2. **리포트 열람 (`/parent/reports/$reportId`)**:
   - 확정 문제 수, 최초 정답률, 재풀이 완료 건수 등 핵심 3대 지표 확인.
   - 교사 총평 및 가정 지도 질문 열람.
   - 사진 원본이나 내부 감사 메모는 철저히 격리되어 비공개 보장.
   - A4 인쇄 미리보기 및 `window.print()` 출력.

### 3.4 원장/관리자 시나리오 (Admin Flow)
1. **운영 관리 센터 (`/admin/settings`)**:
   - **계정 및 배정 관리**: 학생 관리번호 중복 검증, 학생당 교사 최대 4명 / 학부모 최대 2명 배정 한도 준수.
   - **개인정보 및 동의 증빙**: 만 14세 미만 법정대리인 확인 증빙, 보관 주기(사진 90일, 로그 30일 등) 설정.
   - **AI 운영 모니터링**: AI 자동 공개 On/Off 제어, 월 예산(10만 원) 게이지 및 80% 경고 표시.
   - **AI 교정 규칙 관리**: 교사가 제안한 오류 교정 원칙을 회귀 테스트 검증 후 공식 활성화.

---

## 4. 자동화 테스트 매핑 및 검증 현황

본 프로토타입은 총 22개 테스트 파일, 169개의 단위 및 통합 테스트를 통해 빈틈없이 검증되었습니다:

- **E2E 핵심 시나리오 테스트**: `src/test/prototype-scenarios.test.ts` (D01~D03, 통합 라이프사이클)
- **공개 DTO 격리 검증**: `src/test/public-dto.test.ts` (비공개 자산 누출 방지)
- **전체 URL 라우팅 계약 검증**: `src/test/app-routing.test.tsx` (21개 URL 및 404 라우팅 가드)
- **학생 제출/진단/재풀이 흐름**: `src/test/submission-flow.test.tsx`, `src/test/student-case.test.tsx`, `src/test/student-retry.test.tsx`
- **교사 대시보드/검수 흐름**: `src/test/teacher-flow.test.tsx`, `src/test/teacher-review-policy.test.ts`
- **맞춤 복습 및 품질 검수 흐름**: `src/test/review-flow.test.tsx`, `src/test/review-policy.test.ts`
- **리포트 발행/인쇄/열람 흐름**: `src/test/report-flow.test.tsx`, `src/test/report-policy.test.ts`
- **원장 운영 설정 흐름**: `src/test/admin-settings-flow.test.tsx`, `src/test/admin-policy.test.ts`
- **인증 및 세션 전환 흐름**: `src/test/auth-flow.test.tsx`
- **도메인 정책 단위 테스트**: `src/test/photo-policy.test.ts`, `src/test/case-policy.test.ts`, `src/test/hint-policy.test.ts`, `src/test/metrics.test.ts`
