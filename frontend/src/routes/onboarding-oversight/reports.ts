import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import { normalizeOnboardingOversightReportFilters } from "@/features/onboarding-oversight/report-filters";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";

const OnboardingOversightReportsPage = lazy(async () => ({
	default: (
		await import(
			"../../features/onboarding-oversight/pages/OnboardingOversightReportsPage"
		)
	).OnboardingOversightReportsPage,
}));

export const Route = createFileRoute("/onboarding-oversight/reports")({
	beforeLoad: () => ({
		backLink: { href: "/", label: i18n.t("nav.home") },
	}) satisfies RouteBackLinkContext,
	component: OnboardingOversightReportsPage,
	validateSearch: normalizeOnboardingOversightReportFilters,
});