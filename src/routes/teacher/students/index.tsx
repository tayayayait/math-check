import { createFileRoute } from "@tanstack/react-router";
import { StudentListPage } from "../../../features/teacher/StudentListPage";

export const Route = createFileRoute("/teacher/students/")({
  component: StudentListPage,
});
