import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "../../features/auth/role-guard";
import { DemoControls } from "../../components/app/DemoControls";
import { AdminSettingsPage } from "../../features/admin/AdminSettingsPage";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsRoute,
});

function AdminSettingsRoute() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-background">
        <DemoControls />
        <AdminSettingsPage />
      </div>
    </RoleGuard>
  );
}
