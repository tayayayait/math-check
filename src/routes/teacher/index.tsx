import { createFileRoute } from "@tanstack/react-router";
import { TeacherDashboardPage } from "../../features/teacher/TeacherDashboardPage";

export const Route = createFileRoute("/teacher/")({
  component: TeacherDashboardPage,
});
