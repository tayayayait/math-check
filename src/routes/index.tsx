import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useDemoSession } from "../features/auth/DemoSessionProvider";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { session, role, isLoading } = useDemoSession();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session || !role) {
    return <Navigate to="/login" />;
  }

  if (role === "STUDENT") {
    return <Navigate to="/student" />;
  }
  if (role === "TEACHER") {
    return <Navigate to="/teacher" />;
  }
  if (role === "PARENT") {
    return <Navigate to="/parent" />;
  }
  return <Navigate to="/admin/settings" />;
}
