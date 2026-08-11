import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import { normalizeOnboardingOversightQueueFilters } from "@/features/onboarding-oversight/queue-filters";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";

const OnboardingOversightQueuePage = lazy(async () => ({
	default: (
		await import(
			"../../features/onboarding-oversight/pages/OnboardingOversightQueuePage"
		)
	).OnboardingOversightQueuePage,
}));

export const Route = createFileRoute("/onboarding-oversight/queue")({
	beforeLoad: async () => ({
		backLink: { href: "/", label: i18n.t("nav.home") },
	}) satisfies RouteBackLinkContext,
	component: OnboardingOversightQueuePage,
	validateSearch: normalizeOnboardingOversightQueueFilters,
});
