import { createFileRoute } from "@tanstack/react-router";

import { OnboardingOversightPage } from "@/features/onboarding-oversight/pages/OnboardingOversightPage";

export const Route = createFileRoute("/onboarding-oversight/")({
	component: OnboardingOversightPage,
});
