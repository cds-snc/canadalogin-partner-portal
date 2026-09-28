import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import { HttpRequestError } from "@/fetch/errors";
import { getCurrentUserRPApplicationDepartment } from "@/fetch/rp-applications";
import { requireAuthenticatedUser } from "../../features/auth/auth-routing";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";

export const Route = createFileRoute("/applications/$applicationUuid")({
	beforeLoad: async ({ params, location }) => {
		await requireAuthenticatedUser(`/applications/${params.applicationUuid}`);

		const applicationPath = `/applications/${params.applicationUuid}`;
		const departmentSetupPath = `${applicationPath}/department-setup`;
		const environmentsPath = `${applicationPath}/environments`;
		const isDepartmentSetup = location.pathname === departmentSetupPath;
		const isEnvironments = location.pathname === environmentsPath;
		let applicationName: string | null = null;

		if (!isDepartmentSetup && !isEnvironments) {
			try {
				const preflight = await getCurrentUserRPApplicationDepartment(
					params.applicationUuid
				);
				applicationName = preflight.dnrAppName ?? null;
				if (preflight.departmentId === null) {
					throw redirect({
						replace: true,
						to: "/applications/$applicationUuid/department-setup",
						params: { applicationUuid: params.applicationUuid },
						search: { redirect: location.href },
					}) as unknown as Error;
				}
			} catch (error) {
				if (
					error instanceof HttpRequestError &&
					(error.status === 403 || error.status === 404)
				) {
					// Child pages handle access and not-found errors.
				} else {
					throw error;
				}
			}
		}

		return {
			backLink: {
				href: "/applications",
				label: i18n.t("nav.applications"),
			},
			rpApplicationName: applicationName,
		} satisfies RouteBackLinkContext & { rpApplicationName: string | null };
	},
	component: Outlet,
});