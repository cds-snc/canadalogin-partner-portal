import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
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
			backLink: { href: appHref, label: appName },
		} satisfies RouteBackLinkContext;
	},
	component: MAUReportPage,
});
