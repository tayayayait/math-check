import { createFileRoute } from "@tanstack/react-router";
import { ReportEditorPage } from "../../../features/report/ReportEditorPage";

export const Route = createFileRoute("/teacher/reports/$reportId")({
  component: TeacherReportDetailRoute,
});

function TeacherReportDetailRoute() {
  return <ReportEditorPage />;
}
