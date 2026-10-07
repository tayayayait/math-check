import { createFileRoute } from "@tanstack/react-router";
import { SubmissionPage } from "../../../features/student/SubmissionPage";

export const Route = createFileRoute("/student/submissions/new")({
  component: SubmissionPage,
});
