import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { HttpRequestError } from "@/fetch/errors";
import {
	getAccessibleRPApplication,
} from "@/fetch/rp-applications";
import { requirePartnerAccess } from "../../features/auth/auth-routing";

export const Route = createFileRoute("/your-applications/$rpApplicationUuid")({
	beforeLoad: async ({ params, location }) => {
		await requirePartnerAccess(
			`/your-applications/${params.rpApplicationUuid}`
		);

		const departmentSetupPath = `/your-applications/${params.rpApplicationUuid}/department-setup`;
		const isDepartmentSetup = location.pathname === departmentSetupPath;

		let rpApplicationName: string | null = null;
		let rpApplicationRole: string | null = null;
		let workspaceUuid: string | null = null;

		if (!isDepartmentSetup) {
			try {
				const application = await getAccessibleRPApplication(
					params.rpApplicationUuid
				);
				rpApplicationName = application.dnrAppName;
				rpApplicationRole = application.role;
				workspaceUuid = application.workspaceUuid;
			} catch (err) {
				if (
					err instanceof HttpRequestError &&
					(err.status === 403 || err.status === 404)
				) {
					throw redirect({
						href: "/error?kind=not_found",
						replace: true,
					}) as unknown as Error;
				} else {
					throw err;
				}
			}
		}

		return {
			backLink: {
				href: "/your-applications",
				label: i18n.t("nav.dashboard"),
			},
			rpApplicationName,
			rpApplicationRole,
			workspaceUuid,
		} satisfies RouteBackLinkContext & {
			rpApplicationName: string | null;
			rpApplicationRole: string | null;
			workspaceUuid: string | null;
		};
	},
	component: Outlet,
});
