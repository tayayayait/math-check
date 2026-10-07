import { createFileRoute } from "@tanstack/react-router";
import { StudentShell } from "../components/layout/StudentShell";
import { RoleGuard } from "../features/auth/role-guard";

export const Route = createFileRoute("/student")({
  component: StudentRoute,
});

function StudentRoute() {
  return (
    <RoleGuard allowedRoles={["STUDENT"]}>
      <StudentShell />
    </RoleGuard>
  );
}
