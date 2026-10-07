/**
 * 합성 교사 4명 데이터 픽스처
 * data/demo/fixtures.teacher.ts
 */

import type { DemoSessionDto } from "../../contracts/dto";

export interface TeacherFixture {
  session: DemoSessionDto;
  assignedStudentIds: string[];
}

export const TEACHER_FIXTURES: TeacherFixture[] = [
  {
    session: {
      actorId: "usr_teacher_01",
      name: "강선생",
      role: "TEACHER",
      accountStatus: "ACTIVE",
      email: "kang.teacher@example.com",
      availableLearners: [],
      mustChangePassword: false,
      consents: {
        serviceTerms: true,
        privacyPolicy: true,
        parentalConsent: true,
        consentVersion: "v1.0",
      },
    },
    assignedStudentIds: [
      "usr_student_01",
      "usr_student_02",
      "usr_student_03",
      "usr_student_04",
      "usr_student_05",
      "usr_student_06",
      "usr_student_07",
    ],
  },
  {
    session: {
      actorId: "usr_teacher_02",
      name: "박선생",
      role: "TEACHER",
      accountStatus: "ACTIVE",
      email: "park.teacher@example.com",
      availableLearners: [],
      mustChangePassword: false,
      consents: {
        serviceTerms: true,
        privacyPolicy: true,
        parentalConsent: true,
        consentVersion: "v1.0",
      },
    },
    assignedStudentIds: ["usr_student_08", "usr_student_09", "usr_student_10", "usr_student_11"],
  },
  {
    session: {
      actorId: "usr_teacher_03",
      name: "이선생",
      role: "TEACHER",
      accountStatus: "ACTIVE",
      email: "lee.teacher@example.com",
      availableLearners: [],
      mustChangePassword: false,
      consents: {
        serviceTerms: true,
        privacyPolicy: true,
        parentalConsent: true,
        consentVersion: "v1.0",
      },
    },
    assignedStudentIds: ["usr_student_12", "usr_student_13"],
  },
  {
    session: {
      actorId: "usr_teacher_04",
      name: "정선생",
      role: "TEACHER",
      accountStatus: "ACTIVE",
      email: "jung.teacher@example.com",
      availableLearners: [],
      mustChangePassword: false,
      consents: {
        serviceTerms: true,
        privacyPolicy: true,
        parentalConsent: true,
        consentVersion: "v1.0",
      },
    },
    assignedStudentIds: ["usr_student_14", "usr_student_15"],
  },
];
