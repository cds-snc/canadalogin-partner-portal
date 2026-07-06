import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBreadcrumbContext } from "@/types/route-breadcrumbs";
import { requireAuthenticatedUser } from "../../../features/auth/auth-routing";

const MAUReportPage = lazy(async () => ({
	default: (await import("../../../features/mau-reports/pages/MAUReportPage"))
		.MAUReportPage,
}));

export const Route = createFileRoute(
	"/your-applications/$rpApplicationUuid/mau-report"
)({
	beforeLoad: async ({ params, context }) => {
		await requireAuthenticatedUser(
			`/your-applications/${params.rpApplicationUuid}/mau-report`
		);

		const appName =
			(context as { rpApplicationName?: string | null }).rpApplicationName ??
			i18n.t("nav.dashboard");
		const appHref = `/your-applications/${params.rpApplicationUuid}`;

		return {
			breadcrumbs: [
				{ href: "/", label: i18n.t("nav.home") },
				{ href: "/your-applications", label: i18n.t("nav.dashboard") },
				{ href: appHref, label: appName },
				{
					href: `/your-applications/${params.rpApplicationUuid}/mau-report`,
					label: i18n.t("mauReport.title"),
				},
			],
		} satisfies RouteBreadcrumbContext;
	},
	component: MAUReportPage,
});
