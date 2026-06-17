import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBreadcrumbContext } from "@/types/route-breadcrumbs";
import { requireAuthenticatedUser } from "../../../../features/auth/auth-routing";

const MAUReportPage = lazy(async () => ({
	default: (
		await import("../../../../features/mau-reports/pages/MAUReportPage")
	).MAUReportPage,
}));

export const Route = createFileRoute(
	"/rp-applications/mine/$rpApplicationUuid/mau-report"
)({
	beforeLoad: async ({ params }) => {
		await requireAuthenticatedUser(
			`/rp-applications/mine/${params.rpApplicationUuid}/mau-report`
		);

		return {
			breadcrumbs: [
				{ href: "/", label: i18n.t("nav.home") },
				{ href: "/dashboard", label: i18n.t("nav.dashboard") },
				{
					href: `/rp-applications/mine/${params.rpApplicationUuid}/mau-report`,
					label: i18n.t("mauReport.title"),
				},
			],
		} satisfies RouteBreadcrumbContext;
	},
	component: MAUReportPage,
});
