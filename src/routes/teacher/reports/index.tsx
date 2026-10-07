import { createFileRoute } from "@tanstack/react-router";
import { TeacherReportListPage } from "../../../features/report/TeacherReportListPage";

export const Route = createFileRoute("/teacher/reports/")({
  component: TeacherReportsListRoute,
});

function TeacherReportsListRoute() {
  return <TeacherReportListPage />;
}
