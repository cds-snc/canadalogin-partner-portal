import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireAuthenticatedUser } from "../../../../features/auth/auth-routing";

const MAUReportPage = lazy(async () => ({
	default: (await import("../../../../features/mau-reports/pages/MAUReportPage"))
		.MAUReportPage,
}));

export const Route = createFileRoute(
	"/rp-applications/mine/$rpApplicationUuid/mau-report"
)({
	beforeLoad: async ({ params }) =>
		requireAuthenticatedUser(
			`/rp-applications/mine/${params.rpApplicationUuid}/mau-report`
		),
	component: MAUReportPage,
});
