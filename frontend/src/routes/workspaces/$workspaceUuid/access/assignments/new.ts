import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";

const WorkspaceAccessAssignmentNewPage = lazy(async () => ({
	default: (
		await import("@/features/workspaces/pages/WorkspaceAccessAssignmentNewPage")
	).WorkspaceAccessAssignmentNewPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/access/assignments/new"
)({
	beforeLoad: ({ params }) =>
		({
			backLink: {
				href: `/workspaces/${params.workspaceUuid}/access/assignments`,
				label: i18n.t("workspaces.backToAssignmentsAction"),
			},
			breadcrumbLabel: i18n.t("workspaces.addExistingUserTaskTitle"),
		}) satisfies RouteBackLinkContext,
	component: WorkspaceAccessAssignmentNewPage,
});
