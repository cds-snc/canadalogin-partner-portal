import { createFileRoute, Outlet } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";

export const Route = createFileRoute("/users/$userUuid/workspace-access")({
	beforeLoad: ({ params }) =>
		({
			backLink: {
				href: `/users/${params.userUuid}`,
				label: i18n.t("users.backToSelectedUserAction"),
			},
			breadcrumbLabel: i18n.t("users.workspaceAccessTitle"),
		}) satisfies RouteBackLinkContext,
	component: Outlet,
});
