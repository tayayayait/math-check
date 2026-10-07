import { createFileRoute } from "@tanstack/react-router";
import { ReviewQueuePage } from "../../features/teacher/ReviewQueuePage";

export const Route = createFileRoute("/teacher/reviews")({
  component: ReviewQueuePage,
});
