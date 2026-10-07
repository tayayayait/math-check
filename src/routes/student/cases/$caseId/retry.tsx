import { createFileRoute } from "@tanstack/react-router";
import { RetryPage } from "../../../../features/student/RetryPage";

export const Route = createFileRoute("/student/cases/$caseId/retry")({
  component: RetryPage,
});
