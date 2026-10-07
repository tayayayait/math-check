/**
 * 합성 학부모 데이터 픽스처
 * data/demo/fixtures.parent.ts
 */

import type { DemoSessionDto } from "../../contracts/dto";

export interface ParentFixture {
  session: DemoSessionDto;
  childrenStudentIds: string[];
}

export const PARENT_FIXTURES: ParentFixture[] = [
  // 1. 자녀 1명 (김민수)
  {
    session: {
      actorId: "usr_parent_01",
      name: "김학부모",
      role: "PARENT",
      accountStatus: "ACTIVE",
      email: "parent.minsu@example.com",
      availableLearners: [
        {
          learnerId: "usr_student_01",
          name: "김민수",
          gradeLevel: 1,
          relationStatus: "ACTIVE",
        },
      ],
      mustChangePassword: false,
      consents: {
        serviceTerms: true,
        privacyPolicy: true,
        parentalConsent: true,
        consentVersion: "v1.0",
      },
    },
    childrenStudentIds: ["usr_student_01"],
  },

  // 2. 자녀 2명 (이지우, 박하은)
  {
    session: {
      actorId: "usr_parent_02",
      name: "이학부모",
      role: "PARENT",
      accountStatus: "ACTIVE",
      email: "parent.jiwoo@example.com",
      availableLearners: [
        {
          learnerId: "usr_student_02",
          name: "이지우",
          gradeLevel: 1,
          relationStatus: "ACTIVE",
        },
        {
          learnerId: "usr_student_03",
          name: "박하은",
          gradeLevel: 1,
          relationStatus: "ACTIVE",
        },
      ],
      mustChangePassword: false,
      consents: {
        serviceTerms: true,
        privacyPolicy: true,
        parentalConsent: true,
        consentVersion: "v1.0",
      },
    },
    childrenStudentIds: ["usr_student_02", "usr_student_03"],
  },

  // 3. 자녀 0명 (초기 상태)
  {
    session: {
      actorId: "usr_parent_03",
      name: "박학부모",
      role: "PARENT",
      accountStatus: "ACTIVE",
      email: "parent.new@example.com",
      availableLearners: [],
      mustChangePassword: false,
      consents: {
        serviceTerms: true,
        privacyPolicy: true,
        parentalConsent: true,
        consentVersion: "v1.0",
      },
    },
    childrenStudentIds: [],
  },
];
