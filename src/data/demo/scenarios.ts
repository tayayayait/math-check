/**
 * 고정 검수 데모 시나리오 정의
 * data/demo/scenarios.ts
 */

export interface DemoScenarioDefinition {
  id: string;
  name: string;
  description: string;
  targetRole: "STUDENT" | "TEACHER" | "PARENT" | "ADMIN";
  expectedVerdict?: string;
  expectedStatus?: string;
}

export const DEMO_SCENARIOS: DemoScenarioDefinition[] = [
  {
    id: "SCN_CORRECT",
    name: "정답 시나리오",
    description: "올바른 풀이와 답으로 진단되어 정답 판정 및 자동 완료 처리",
    targetRole: "STUDENT",
    expectedVerdict: "CORRECT",
    expectedStatus: "RESOLVED",
  },
  {
    id: "SCN_SAFE_INCORRECT",
    name: "안전 오답 및 힌트 단계 열람 시나리오",
    description: "오답 위치와 개념이 특정되어 1~3단계 힌트 순차 공개 및 재풀이 유도",
    targetRole: "STUDENT",
    expectedVerdict: "INCORRECT",
    expectedStatus: "RETRY_REQUIRED",
  },
  {
    id: "SCN_FOURTH_INCORRECT",
    name: "네 번째 오답 한도 시나리오",
    description: "4회 시도를 모두 소진하여 추가 시도 차단 및 선생님 확인 필요 상태 전이",
    targetRole: "STUDENT",
    expectedVerdict: "INCORRECT",
    expectedStatus: "WAITING_TEACHER",
  },
  {
    id: "SCN_UNREADABLE",
    name: "판독 불가 시나리오",
    description: "손글씨 글자 또는 부호 식별 어려움으로 사진 재촬영/교체 유도",
    targetRole: "STUDENT",
    expectedVerdict: "UNREADABLE",
    expectedStatus: "RETRY_REQUIRED",
  },
  {
    id: "SCN_INSUFFICIENT_WORK",
    name: "풀이 부족 시나리오",
    description: "중간 풀이 과정 없이 답만 작성되어 풀이 과정 추가 촬영 유도",
    targetRole: "STUDENT",
    expectedVerdict: "UNDETERMINED",
    expectedStatus: "RETRY_REQUIRED",
  },
  {
    id: "SCN_UNSUPPORTED_TYPE",
    name: "미지원 문제 유형 시나리오",
    description: "일차방정식 범위를 벗어난 복합 문제로 선생님 직접 검수로 이관",
    targetRole: "STUDENT",
    expectedVerdict: "UNDETERMINED",
    expectedStatus: "WAITING_TEACHER",
  },
  {
    id: "SCN_PRIVACY_HOLD",
    name: "개인정보 보류 시나리오",
    description: "풀이 사진 내 이름/전화번호 등 개인정보 감지로 가림 처리 후 재촬영 요구",
    targetRole: "STUDENT",
    expectedVerdict: "UNDETERMINED",
    expectedStatus: "RETRY_REQUIRED",
  },
  {
    id: "SCN_TEACHER_REVIEW",
    name: "교사 검수 및 수정 시나리오",
    description: "교사가 AI 진단 결과를 검수하고 피드백 및 오류 줄을 수동 보정",
    targetRole: "TEACHER",
    expectedStatus: "WAITING_TEACHER",
  },
  {
    id: "SCN_REVIEW_CANDIDATE",
    name: "복습 문제 승인 시나리오",
    description: "오답 개념 기반 복습 후보 생성 및 교사 검수 후 학생 풀이 활성화",
    targetRole: "TEACHER",
    expectedStatus: "PENDING_APPROVAL",
  },
  {
    id: "SCN_REPORT_PUBLISH",
    name: "리포트 발행 및 학부모 열람 시나리오",
    description: "학습 분석 리포트 초안 작성, 코멘트 첨부, 정식 발행 및 학부모 열람",
    targetRole: "PARENT",
    expectedStatus: "PUBLISHED",
  },
];
