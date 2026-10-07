/**
 * 모의 사용 한도 기준값
 * contracts/limits.ts
 */

export const DEMO_LIMITS = {
  /** 학생 모의 분석 일간 한도 (서울 날짜 기준) */
  STUDENT_DAILY_ANALYSIS_LIMIT: 10,
  /** 학생 분당 분석 요청 한도 */
  STUDENT_PER_MINUTE_ANALYSIS_LIMIT: 3,
  /** 힌트 분당 요청 한도 */
  HINT_PER_MINUTE_LIMIT: 10,
  /** 교사 분당 조회 한도 */
  TEACHER_READ_PER_MINUTE_LIMIT: 120,
  /** 교사 분당 저장/수정 한도 */
  TEACHER_WRITE_PER_MINUTE_LIMIT: 30,
  /** 학부모 일간 리포트 요청 한도 */
  PARENT_DAILY_REPORT_REQUEST_LIMIT: 3,
  /** 학부모 시간당 리포트 요청 한도 */
  PARENT_HOURLY_REPORT_REQUEST_LIMIT: 3,
  /** 로그인 연속 실패 시 차단 임계값 (15분 이내) */
  LOGIN_FAILURE_THRESHOLD: 5,
  /** 로그인 차단 지속 시간 (초) */
  LOGIN_LOCKOUT_DURATION_SECONDS: 15 * 60,
  /** 시도 기본 최대 횟수 */
  DEFAULT_MAX_ATTEMPTS: 4,
  /** 교사 부여 추가 허용 최대 횟수 */
  MAX_EXTRA_ATTEMPT_ALLOWANCE: 2,
  /** 힌트 최대 단계 */
  MAX_HINT_LEVEL: 3,
  /** 복습 문제 후보 최대 생성 개수 */
  MAX_REVIEW_CANDIDATES: 3,
} as const;
