import { createFileRoute } from "@tanstack/react-router";
import { TeacherCasePage } from "../../../features/teacher/TeacherCasePage";

export const Route = createFileRoute("/teacher/cases/$caseId")({
  component: TeacherCasePage,
});
