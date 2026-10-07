/**
 * 중학 수학 1학년 일차방정식 단원 및 개념 분류 체계
 * data/demo/taxonomy.ts
 */

import type { ConceptId } from "../../contracts/domain";

export interface UnitDefinition {
  unitId: string;
  gradeLevel: number;
  title: string;
  concepts: Array<{
    conceptId: ConceptId;
    title: string;
    description: string;
    autoEnabled: boolean;
  }>;
}

export const DEMO_TAXONOMY: UnitDefinition[] = [
  {
    unitId: "M1_LINEAR_EQUATIONS",
    gradeLevel: 1,
    title: "1학년 > 문자와 식 > 일차방정식의 풀이",
    concepts: [
      {
        conceptId: "M1_EQ_BALANCE",
        title: "등식의 성질",
        description:
          "등식의 양변에 같은 수를 더하거나 빼거나 곱하거나 0이 아닌 수로 나누어도 등식은 성립한다.",
        autoEnabled: true,
      },
      {
        conceptId: "M1_EQ_TRANSPOSE",
        title: "이항",
        description: "등식의 성질을 이용하여 한 변에 있는 항의 부호를 바꾸어 다른 변으로 옮긴다.",
        autoEnabled: true,
      },
      {
        conceptId: "M1_DISTRIBUTION",
        title: "분배법칙",
        description: "괄호가 있는 일차방정식에서 분배법칙을 이용하여 괄호를 풀고 정리한다.",
        autoEnabled: true,
      },
      {
        conceptId: "M1_RATIONAL_COEFFICIENT",
        title: "계수 정리 (소수·분수)",
        description: "계수가 소수이거나 분수인 경우 양변에 적당한 수를 곱하여 정수로 고친다.",
        autoEnabled: true,
      },
      {
        conceptId: "M1_EQ_BOTH_SIDES",
        title: "양변 정리 및 일차방정식 풀이",
        description:
          "일차항은 좌변으로, 상수항은 우변으로 모아 ax = b (a ≠ 0) 꼴로 정리하여 해를 구한다.",
        autoEnabled: true,
      },
    ],
  },
];
