import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "../features/auth/AccountPage";
import { RoleGuard } from "../features/auth/role-guard";

export const Route = createFileRoute("/account")({
  component: AccountRoute,
});

function AccountRoute() {
  return (
    <RoleGuard>
      <div className="mx-auto max-w-md py-6 px-4">
        <AccountPage />
      </div>
    </RoleGuard>
  );
}
