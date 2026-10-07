import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

describe("Phase 9 - App routing (전체 URL 계약 매칭 검증)", () => {
  const router = createRouter({
    routeTree,
    context: { queryClient: new QueryClient() },
  });

  const validContractRoutes = [
    { path: "/", description: "진입 루트" },
    { path: "/login", description: "로그인 (A-01)" },
    { path: "/onboarding", description: "온보딩 (A-02)" },
    { path: "/account", description: "계정 및 설정 (A-03)" },
    { path: "/student", description: "학생 홈 (S-01)" },
    { path: "/student/submissions/new", description: "신규 제출 위저드 (S-02)" },
    { path: "/student/cases/case_01", description: "진단 결과 상세 (S-04)" },
    { path: "/student/cases/case_01/retry", description: "재풀이 제출 (S-05)" },
    { path: "/student/history", description: "학습 이력 (S-06)" },
    { path: "/student/reviews/rev_01", description: "학생 맞춤 복습 (S-07)" },
    { path: "/teacher", description: "교사 대시보드 (T-01)" },
    { path: "/teacher/students", description: "학생 목록 (T-02)" },
    { path: "/teacher/students/usr_student_01", description: "학생 상세 (T-03)" },
    { path: "/teacher/reviews", description: "검수 대기열 (T-04)" },
    { path: "/teacher/cases/case_01", description: "진단 검수 상세 (T-05)" },
    { path: "/teacher/review-items/rev_01", description: "복습 문항 검수 (T-06)" },
    { path: "/teacher/reports", description: "리포트 관리 목록 (T-07)" },
    { path: "/teacher/reports/rep_01", description: "리포트 초안 편집 (T-08)" },
    { path: "/admin/settings", description: "원장/대표 운영 관리 (T-09)" },
    { path: "/parent", description: "학부모 홈 (P-01)" },
    { path: "/parent/reports/rep_02", description: "발행 리포트 상세 (P-02)" },
  ];

  for (const { path, description } of validContractRoutes) {
    it(`정상 라우트 매칭: ${description} [${path}]`, () => {
      const matches = router.matchRoutes(path);
      expect(matches.length).toBeGreaterThan(0);
      const leafMatch = matches.at(-1);
      expect(leafMatch).toBeDefined();
      expect(leafMatch?.routeId).not.toBe(rootRouteId);
    });
  }

  it("존재하지 않는 임의의 경로는 루트 라우트만 남거나 잎 매칭이 유효하지 않다", () => {
    const invalidPath = "/completely/unregistered/random/path";
    const matches = router.matchRoutes(invalidPath);
    // TanStack Router는 미등록 경로에 대해 rootRouteId만 매치하거나 빈 배열 또는 root match를 반환함
    const leafMatch = matches.at(-1);
    expect(leafMatch?.routeId === rootRouteId || matches.length === 0).toBe(true);
  });
});
