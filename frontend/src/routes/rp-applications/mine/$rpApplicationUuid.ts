import { Outlet, createFileRoute } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import type { RouteBreadcrumbContext } from "@/types/route-breadcrumbs";
import { requireAuthenticatedUser } from "../../../features/auth/auth-routing";

export const Route = createFileRoute(
	"/rp-applications/mine/$rpApplicationUuid"
)({
	beforeLoad: async ({ params }) => {
		await requireAuthenticatedUser(
			`/rp-applications/mine/${params.rpApplicationUuid}`
		);

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
