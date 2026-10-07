# 수학 손글씨 풀이 AI 진단 서비스 — 프론트엔드 완성 프로토타입 (Blueprint)

`상세서.md` 및 `구현계획.md`를 기반으로 학생·교사·학부모·원장(관리자) 4대 사용자의 전체 인터랙션과 수학 풀이 AI 진단 워크플로우를 완벽하게 구현한 프론트엔드 프로토타입입니다.

---

## 🛠 실행 환경 및 기본 설정

- **런타임 / 패키지 매니저:** Bun 1.3+ (Node.js 22+)
- **프론트엔드 스택:** React 19, TypeScript, TanStack Router, Vite 8, Tailwind CSS 4, Lucide React
- **데이터 모드 (`VITE_DATA_MODE`):**
  - 기본값: `mock` (외부 백엔드/AI 호출 없이 안전한 인메모리 어댑터와 도메인 정책 규칙으로 동작)
  - 네트워크 격리: 외부 API(Supabase, OpenAI, Lovable Gateway) 호출 0건 검증 완료.

---

## 🚀 로컬 실행 방법

```sh
# 1. 의존성 패키지 설치
bun install

# 2. 로컬 개발 서버 실행 (기본 mock 모드)
bun run dev

# 3. 브라우저에서 접속
# http://localhost:3000 (또는 Vite 할당 포트)
```

---

## 👤 데모 계정 및 역할별 진입 가이드

화면 우측 상단 `데모 세션 전환` 메뉴 또는 `/login` 화면의 원클릭 로그인 버튼을 통해 각 역할로 즉시 전환할 수 있습니다:

| 역할 | 이름 / ID | 계정 상태 | 주요 체험 기능 및 경로 |
|:---|:---|:---:|:---|
| **학생** | 김민수 (`usr_student_01`) | 정상 (`ACTIVE`) | • 문제/풀이 사진 등록 및 제출 (`/student/submit`)<br>• 오답 진단 및 1/2/3단계 순차 힌트 열람 (`/student/cases/case_01`)<br>• 최대 4회 재풀이 제출 및 이력 조회 (`/student/history`) |
| **학생** | 이지우 (`usr_student_02`) | 확인 대기 (`WAITING_TEACHER`) | • 판독 불가/교사 확인 대기 상태 확인 (`/student/cases/case_03`) |
| **학생** | 박하은 (`usr_student_03`) | 기회 소진 (`RETRY_REQUIRED`) | • 4회 한도 소진 후 교사 추가 1회 기회 부여 케이스 (`/student/cases/case_04`) |
| **학생** | 정우진 (`usr_student_04`) | 신규 초대 (`INVITED`) | • 온보딩 첫 로그인 임시 비밀번호 변경 폼 (`/onboarding`) |
| **교사** | 박선생 (`usr_teacher_01`) | 정상 (`ACTIVE`) | • 4대 핵심 지표 대시보드 (`/teacher`)<br>• 진단 검수 및 정정 폼 (`/teacher/cases/case_02`)<br>• 맞춤 복습 문항 8대 품질 기준 검수 및 승인 (`/teacher/reviews/rev_01`)<br>• 학부모 리포트 초안 작성 및 공식 발행 (`/teacher/reports/rep_01`) |
| **학부모** | 김학부모 (`usr_parent_01`) | 정상 (`ACTIVE`) | • 연결 자녀(김민수) 리포트 7/30일 요청 (`/parent`)<br>• 발행 리포트 3대 지표 열람 및 A4 규격 인쇄 (`/parent/reports/rep_02`) |
| **원장/대표** | 최원장 (`usr_admin_01`) | 정상 (`ACTIVE`) | • 원장 운영 관리 센터 (`/admin/settings`)<br>  - 계정 및 배정 관리 (관리번호 중복 검증, 배정 한도)<br>  - 개인정보 및 만 14세 미만 동의 증빙<br>  - AI 자동 공개 토글 및 월 예산 모니터링<br>  - AI 교정 규칙 회귀 검증 및 활성화 |

---

## 🧪 4대 품질 검증 명령 및 통과 결과

```sh
# 1. 단위, 통합, 라우팅 테스트 (Vitest: 22개 파일, 169개 테스트 100% PASS)
bun run test

# 2. TypeScript 엄격 타입 검사 (tsc --noEmit: 에러 0건)
bun run typecheck

# 3. 프로덕션 빌드 검사 (vite build: 번들링 성공)
bun run build

# 4. 코드 린트 검사 (eslint: 에러 0건)
bun run lint
```

---

## 📚 산출물 및 인계 문서

프로토타입의 상세 아키텍처 및 검증 결과는 아래 문서에서 확인하실 수 있습니다:

1. **[프로토타입 시나리오 검증서](docs/prototype-scenarios.md)**:
   - D01~D19 핵심 비즈니스 시나리오 기대값 및 테스트 매핑.
   - 학생, 교사, 학부모, 원장의 전체 라이프사이클 흐름.
2. **[프로토타입 품질 검증 보고서](docs/prototype-validation.md)**:
   - 4대 품질 지표, 네트워크 격리(외부 호출 0건), Public DTO 은닉성 검증.
   - 320px~1920px 반응형 및 A4 인쇄 레이아웃, 웹 접근성, 후속 실기기 보류 사항.
3. **[Supabase 백엔드 인계 가이드](docs/backend-handoff.md)**:
   - `IAppRepository` 인터페이스 계약 및 메서드별 DTO/에러 코드 명세.
   - 동시성 제어(낙관적 락), 멱등성 보장, DB 스키마 및 RLS 보안 모델.
   - 후속 백엔드 구축 로드맵 (B1~B8).
