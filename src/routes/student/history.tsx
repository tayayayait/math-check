import { createFileRoute } from "@tanstack/react-router";
import { HistoryPage } from "../../features/student/HistoryPage";

export const Route = createFileRoute("/student/history")({
  component: HistoryPage,
});
