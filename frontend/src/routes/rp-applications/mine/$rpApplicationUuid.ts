import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import type { RouteBreadcrumbContext } from "@/types/route-breadcrumbs";
import { HttpRequestError } from "@/fetch/errors";
import { getCurrentUserRPApplicationDepartment } from "@/fetch/rp-applications";
import { requireAuthenticatedUser } from "../../../features/auth/auth-routing";

export const Route = createFileRoute(
	"/rp-applications/mine/$rpApplicationUuid"
)({
	beforeLoad: async ({ params, location }) => {
		await requireAuthenticatedUser(
			`/rp-applications/mine/${params.rpApplicationUuid}`
		);

		const departmentSetupPath = `/rp-applications/mine/${params.rpApplicationUuid}/department-setup`;
		const isDepartmentSetup = location.pathname === departmentSetupPath;

		if (!isDepartmentSetup) {
			try {
				const preflight = await getCurrentUserRPApplicationDepartment(
					params.rpApplicationUuid
				);
				if (preflight.departmentId === null) {
					throw redirect({
						replace: true,
						to: "/rp-applications/mine/$rpApplicationUuid/department-setup",
						params: { rpApplicationUuid: params.rpApplicationUuid },
						search: { redirect: location.href },
					}) as unknown as Error;
				}
			} catch (err) {
				if (
					err instanceof HttpRequestError &&
					(err.status === 403 || err.status === 404)
				) {
					// Let child routes handle 403/404 in their own error handling
				} else {
					throw err;
				}
			}
		}

		return {
			breadcrumbs: [
				{ href: "/", label: i18n.t("nav.home") },
				{ href: "/dashboard", label: i18n.t("nav.dashboard") },
				{
					href: `/rp-applications/mine/${params.rpApplicationUuid}`,
					label: i18n.t("dashboard.rpApplicationsListTitle"),
				},
			],
		} satisfies RouteBreadcrumbContext;
	},
	component: Outlet,
});
