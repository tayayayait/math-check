import { createFileRoute } from "@tanstack/react-router";
import { StudentDetailPage } from "../../../features/teacher/StudentDetailPage";

export const Route = createFileRoute("/teacher/students/$learnerId")({
  component: StudentDetailPage,
});
