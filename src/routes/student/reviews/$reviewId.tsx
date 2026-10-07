import { createFileRoute } from "@tanstack/react-router";
import { StudentReviewPage } from "../../../features/review/StudentReviewPage";

export const Route = createFileRoute("/student/reviews/$reviewId")({
  component: StudentReviewItemRoute,
});

function StudentReviewItemRoute() {
  return <StudentReviewPage />;
}
