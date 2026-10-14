import { Outlet, createFileRoute } from "@tanstack/react-router";
import i18n from "../../../../common/i18n";
import type { RouteBackLinkContext } from "../../../../types/route-breadcrumbs";

export const Route = createFileRoute(
	"/applications/$applicationUuid/environments/$environmentUuid"
)({
	beforeLoad: ({ params }) =>
		({
			breadcrumbs: [
				{
					href: "/applications",
					label: i18n.t("applicationEnvironments.applications"),
					showBackLabel: false,
				},
				{
					href: `/applications/${params.applicationUuid}/environments`,
					label: i18n.t("applicationEnvironments.title"),
					showBackLabel: false,
				},
			],
		} satisfies RouteBackLinkContext),
	component: Outlet,
});