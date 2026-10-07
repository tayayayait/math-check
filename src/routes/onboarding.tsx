import { createFileRoute } from "@tanstack/react-router";
import { OnboardingPage } from "../features/auth/OnboardingPage";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});
