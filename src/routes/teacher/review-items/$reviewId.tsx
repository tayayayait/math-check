import { createFileRoute } from "@tanstack/react-router";
import { ReviewApprovalPage } from "../../../features/review/ReviewApprovalPage";

export const Route = createFileRoute("/teacher/review-items/$reviewId")({
  component: TeacherReviewItemInspectionRoute,
});

function TeacherReviewItemInspectionRoute() {
  return <ReviewApprovalPage />;
}
