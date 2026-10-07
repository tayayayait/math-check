import { createFileRoute } from "@tanstack/react-router";
import { ParentHomePage } from "../../features/report/ParentHomePage";

export const Route = createFileRoute("/parent/")({
  component: ParentHomeRoute,
});

function ParentHomeRoute() {
  return <ParentHomePage />;
}
