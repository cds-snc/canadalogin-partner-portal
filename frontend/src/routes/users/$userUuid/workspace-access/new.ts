import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";

const UserWorkspaceAccessNewPage = lazy(async () => ({
	default: (
		await import("../../../../features/users/pages/UserWorkspaceAccessNewPage")
	).UserWorkspaceAccessNewPage,
}));

export const Route = createFileRoute("/users/$userUuid/workspace-access/new")({
	beforeLoad: ({ params }) =>
		({
			backLink: {
				href: `/users/${params.userUuid}/workspace-access`,
				label: i18n.t("users.backToWorkspaceAccessAction"),
			},
			breadcrumbLabel: i18n.t("users.addWorkspaceAccessTitle"),
		}) satisfies RouteBackLinkContext,
	component: UserWorkspaceAccessNewPage,
});
