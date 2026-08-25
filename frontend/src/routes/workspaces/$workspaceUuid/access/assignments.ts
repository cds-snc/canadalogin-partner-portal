import { createFileRoute, Outlet } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/access/assignments"
)({
	beforeLoad: ({ params }) =>
		({
			backLink: {
				href: `/workspaces/${params.workspaceUuid}/access`,
				label: i18n.t("workspaces.backToAccessHubAction"),
			},
			breadcrumbLabel: i18n.t("workspaces.currentAssignments"),
		}) satisfies RouteBackLinkContext,
	component: Outlet,
});
