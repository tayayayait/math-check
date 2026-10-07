/**
 * 복습 문제 템플릿 합성 데이터 (10개)
 * data/demo/review-templates.ts
 *
 * 이항, 음수 계수, 분배법칙, 분수 계수, 양변 미지수 각 2개
 * 본 자료는 도안 및 기능 검증용 합성 데이터입니다.
 */

import type { ConceptId } from "../../contracts/domain";

export interface ReviewTemplate {
  templateId: string;
  version: number;
  gradeLevel: number;
  unitId: string;
  conceptId: ConceptId;
  title: string;
  difficulty: "BASIC" | "STANDARD";
  problemText: string;
  expectedAnswer: string;
  independentVerification: string;
  prerequisites: string[];
}

export const REVIEW_TEMPLATES: ReviewTemplate[] = [
  // 1. 이항 연습 1 (BASIC)
  {
    templateId: "TPL_TRANSPOSE_1",
    version: 1,
    gradeLevel: 1,
    unitId: "M1_LINEAR_EQUATIONS",
    conceptId: "M1_EQ_TRANSPOSE",
    title: "상수항 이항 기본",
    difficulty: "BASIC",
    problemText: "일차방정식 $x + 7 = 15$ 의 해를 구하시오.",
    expectedAnswer: "x = 8",
    independentVerification: "x + 7 = 15 => x = 15 - 7 => x = 8. 검산: 8 + 7 = 15 (성립).",
    prerequisites: ["기초 덧셈 뺄셈"],
  },
  // 2. 이항 연습 2 (STANDARD)
  {
    templateId: "TPL_TRANSPOSE_2",
    version: 1,
    gradeLevel: 1,
    unitId: "M1_LINEAR_EQUATIONS",
    conceptId: "M1_EQ_TRANSPOSE",
    title: "음수 상수항 및 일차항 이항",
    difficulty: "STANDARD",
    problemText: "일차방정식 $3x - 5 = 16$ 의 해를 구하시오.",
    expectedAnswer: "x = 7",
    independentVerification: "3x = 16 + 5 => 3x = 21 => x = 7. 검산: 3(7) - 5 = 16 (성립).",
    prerequisites: ["등식의 성질", "자연수 곱셈과 나눗셈"],
  },
  // 3. 음수 계수 처리 1 (BASIC)
  {
    templateId: "TPL_SIGN_1",
    version: 1,
    gradeLevel: 1,
    unitId: "M1_LINEAR_EQUATIONS",
    conceptId: "M1_EQ_BALANCE",
    title: "음의 일차항 계수 양변 나누기",
    difficulty: "BASIC",
    problemText: "일차방정식 $-2x = 14$ 의 해를 구하시오.",
    expectedAnswer: "x = -7",
    independentVerification: "-2x = 14 => x = 14 / (-2) => x = -7. 검산: -2(-7) = 14 (성립).",
    prerequisites: ["정수의 곱셈 나눗셈"],
  },
  // 4. 음수 계수 처리 2 (STANDARD)
  {
    templateId: "TPL_SIGN_2",
    version: 1,
    gradeLevel: 1,
    unitId: "M1_LINEAR_EQUATIONS",
    conceptId: "M1_EQ_BALANCE",
    title: "음수 부호가 포함된 일차방정식",
    difficulty: "STANDARD",
    problemText: "일차방정식 $4 - 3x = 19$ 의 해를 구하시오.",
    expectedAnswer: "x = -5",
    independentVerification: "-3x = 19 - 4 => -3x = 15 => x = -5. 검산: 4 - 3(-5) = 19 (성립).",
    prerequisites: ["정수의 덧셈 뺄셈", "음수 부호 연산"],
  },
  // 5. 분배법칙 괄호 전개 1 (BASIC)
  {
    templateId: "TPL_DISTRIBUTION_1",
    version: 1,
    gradeLevel: 1,
    unitId: "M1_LINEAR_EQUATIONS",
    conceptId: "M1_DISTRIBUTION",
    title: "단일 괄호 분배법칙 전개",
    difficulty: "BASIC",
    problemText: "일차방정식 $2(x + 3) = 14$ 의 해를 구하시오.",
    expectedAnswer: "x = 4",
    independentVerification: "2x + 6 = 14 => 2x = 8 => x = 4. 검산: 2(4 + 3) = 14 (성립).",
    prerequisites: ["분배법칙의 기초"],
  },
  // 6. 분배법칙 괄호 전개 2 (STANDARD)
  {
    templateId: "TPL_DISTRIBUTION_2",
    version: 1,
    gradeLevel: 1,
    unitId: "M1_LINEAR_EQUATIONS",
    conceptId: "M1_DISTRIBUTION",
    title: "음수 계수 분배 및 동류항 정리",
    difficulty: "STANDARD",
    problemText: "일차방정식 $5 - 2(x - 1) = 11$ 의 해를 구하시오.",
    expectedAnswer: "x = -2",
    independentVerification:
      "5 - 2x + 2 = 11 => 7 - 2x = 11 => -2x = 4 => x = -2. 검산: 5 - 2(-3) = 11 (성립).",
    prerequisites: ["괄호 풀기", "부호 주의 분배법칙"],
  },
  // 7. 분수 계수 방정식 1 (BASIC)
  {
    templateId: "TPL_FRACTION_1",
    version: 1,
    gradeLevel: 1,
    unitId: "M1_LINEAR_EQUATIONS",
    conceptId: "M1_RATIONAL_COEFFICIENT",
    title: "양변 최소공배수 곱하기 기초",
    difficulty: "BASIC",
    problemText: "일차방정식 $\\frac{x}{3} + 2 = 5$ 의 해를 구하시오.",
    expectedAnswer: "x = 9",
    independentVerification: "x/3 = 3 => x = 9. 검산: 9/3 + 2 = 5 (성립).",
    prerequisites: ["유리수의 덧셈 뺄셈", "분수의 기본 성질"],
  },
  // 8. 분수 계수 방정식 2 (STANDARD)
  {
    templateId: "TPL_FRACTION_2",
    version: 1,
    gradeLevel: 1,
    unitId: "M1_LINEAR_EQUATIONS",
    conceptId: "M1_RATIONAL_COEFFICIENT",
    title: "서로 다른 분모의 최소공배수 처리",
    difficulty: "STANDARD",
    problemText: "일차방정식 $\\frac{x + 1}{2} - \\frac{x - 1}{3} = 2$ 의 해를 구하시오.",
    expectedAnswer: "x = 7",
    independentVerification:
      "양변에 6을 곱하면: 3(x+1) - 2(x-1) = 12 => 3x + 3 - 2x + 2 = 12 => x + 5 = 12 => x = 7. 검산: (8/2) - (6/3) = 4 - 2 = 2 (성립).",
    prerequisites: ["최소공배수", "분수식의 괄호 묶음"],
  },
  // 9. 양변 미지수 정리 1 (BASIC)
  {
    templateId: "TPL_BOTH_SIDES_1",
    version: 1,
    gradeLevel: 1,
    unitId: "M1_LINEAR_EQUATIONS",
    conceptId: "M1_EQ_BOTH_SIDES",
    title: "양변에 미지수가 있는 기본 일차방정식",
    difficulty: "BASIC",
    problemText: "일차방정식 $5x - 4 = 2x + 5$ 의 해를 구하시오.",
    expectedAnswer: "x = 3",
    independentVerification:
      "5x - 2x = 5 + 4 => 3x = 9 => x = 3. 검산: 5(3)-4 = 11, 2(3)+5 = 11 (성립).",
    prerequisites: ["동류항 덧셈 뺄셈"],
  },
  // 10. 양변 미지수 정리 2 (STANDARD)
  {
    templateId: "TPL_BOTH_SIDES_2",
    version: 1,
    gradeLevel: 1,
    unitId: "M1_LINEAR_EQUATIONS",
    conceptId: "M1_EQ_BOTH_SIDES",
    title: "괄호와 양변 미지수가 혼합된 일차방정식",
    difficulty: "STANDARD",
    problemText: "일차방정식 $3(x - 2) = 7x + 6$ 의 해를 구하시오.",
    expectedAnswer: "x = -3",
    independentVerification:
      "3x - 6 = 7x + 6 => 3x - 7x = 6 + 6 => -4x = 12 => x = -3. 검산: 3(-5) = -15, 7(-3)+6 = -15 (성립).",
    prerequisites: ["분배법칙", "음수 계수 이항"],
  },
];
