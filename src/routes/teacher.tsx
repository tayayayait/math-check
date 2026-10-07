import { createFileRoute } from "@tanstack/react-router";
import { TeacherShell } from "../components/layout/TeacherShell";
import { RoleGuard } from "../features/auth/role-guard";

export const Route = createFileRoute("/teacher")({
  component: TeacherRoute,
});

function TeacherRoute() {
  return (
    <RoleGuard allowedRoles={["TEACHER"]}>
      <TeacherShell />
    </RoleGuard>
  );
}
