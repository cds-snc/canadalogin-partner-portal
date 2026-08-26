import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";

const WorkspaceAccessInvitationPage = lazy(async () => ({
	default: (
		await import("@/features/workspaces/pages/WorkspaceAccessInvitationPage")
	).WorkspaceAccessInvitationPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/access/invitations/$invitationUuid"
)({
	beforeLoad: ({ params }) =>
		({
			backLink: {
				href: `/workspaces/${params.workspaceUuid}/access/invitations`,
				label: i18n.t("workspaces.backToInvitationsAction"),
			},
			breadcrumbLabel: i18n.t("workspaces.invitationDetailsTitle"),
		}) satisfies RouteBackLinkContext,
	component: WorkspaceAccessInvitationPage,
});
