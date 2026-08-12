import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import { requireCapability } from "@/features/auth/auth-routing";
import { normalizeOnboardingOversightReportFilters } from "@/features/onboarding-oversight/report-filters";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";

const WorkspaceReportsPage = lazy(async () => ({
	default: (
		await import("../../../features/workspaces/pages/WorkspaceReportsPage")
	).WorkspaceReportsPage,
}));

export const Route = createFileRoute("/workspaces/$workspaceUuid/reports")({
	beforeLoad: async ({ params }) => {
		await requireCapability(
			`/workspaces/${params.workspaceUuid}/reports`,
			"aggregate_report_read",
			params.workspaceUuid
		);

		return {
			backLink: {
				href: `/workspaces/${params.workspaceUuid}`,
				label: i18n.t("workspaces.workspaceLabel"),
			},
		} satisfies RouteBackLinkContext;
	},
	component: WorkspaceReportsPage,
	validateSearch: normalizeOnboardingOversightReportFilters,
});
