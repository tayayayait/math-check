import { createFileRoute } from "@tanstack/react-router";
import { CasePage } from "../../../../features/student/CasePage";

export const Route = createFileRoute("/student/cases/$caseId/")({
  component: CasePage,
});
