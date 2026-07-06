import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import type { RouteBreadcrumbContext } from "@/types/route-breadcrumbs";
import { HttpRequestError } from "@/fetch/errors";
import { getCurrentUserRPApplicationDepartment } from "@/fetch/rp-applications";
import { requireAuthenticatedUser } from "../../features/auth/auth-routing";

export const Route = createFileRoute(
	"/your-applications/$rpApplicationUuid"
)({
	beforeLoad: async ({ params, location }) => {
		await requireAuthenticatedUser(
			`/your-applications/${params.rpApplicationUuid}`
		);

		const departmentSetupPath = `/your-applications/${params.rpApplicationUuid}/department-setup`;
		const isDepartmentSetup = location.pathname === departmentSetupPath;

		let rpApplicationName: string | null = null;

		if (!isDepartmentSetup) {
			try {
				const preflight = await getCurrentUserRPApplicationDepartment(
					params.rpApplicationUuid
				);
				rpApplicationName = preflight.dnrAppName ?? null;
				if (preflight.departmentId === null) {
					throw redirect({
						replace: true,
					to: "/your-applications/$rpApplicationUuid/department-setup",
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
				{ href: "/your-applications", label: i18n.t("nav.dashboard") },
				{
					href: `/your-applications/${params.rpApplicationUuid}`,
					label: rpApplicationName ?? i18n.t("yourApplications.unknownApplication"),
				},
			],
			rpApplicationName,
		} satisfies RouteBreadcrumbContext & { rpApplicationName: string | null };
	},
	component: Outlet,
});
