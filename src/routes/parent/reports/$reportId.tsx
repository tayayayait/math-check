import { createFileRoute } from "@tanstack/react-router";
import { ParentReportPage } from "../../../features/report/ParentReportPage";

export const Route = createFileRoute("/parent/reports/$reportId")({
  component: ParentReportDetailRoute,
});

function ParentReportDetailRoute() {
  return <ParentReportPage />;
}
