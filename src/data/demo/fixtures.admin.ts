/**
 * 합성 학원 대표/원장 데이터 픽스처
 * data/demo/fixtures.admin.ts
 */

import type { DemoSessionDto } from "../../contracts/dto";

export const ADMIN_FIXTURE: { session: DemoSessionDto } = {
  session: {
    actorId: "usr_admin_01",
    name: "최대표",
    role: "ADMIN",
    accountStatus: "ACTIVE",
    email: "director.choi@example.com",
    availableLearners: [],
    mustChangePassword: false,
    consents: {
      serviceTerms: true,
      privacyPolicy: true,
      parentalConsent: true,
      consentVersion: "v1.0",
    },
  },
};
