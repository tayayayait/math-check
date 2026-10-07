import { createFileRoute } from "@tanstack/react-router";
import { ParentShell } from "../components/layout/ParentShell";
import { RoleGuard } from "../features/auth/role-guard";

export const Route = createFileRoute("/parent")({
  component: ParentRoute,
});

function ParentRoute() {
  return (
    <RoleGuard allowedRoles={["PARENT"]}>
      <ParentShell />
    </RoleGuard>
  );
}
