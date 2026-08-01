import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const WorkspaceApplicationsListPage = lazy(async () => ({
	default: (
		await import("../../../../features/workspaces/pages/WorkspaceApplicationsListPage")
	).WorkspaceApplicationsListPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/"
)({
	component: WorkspaceApplicationsListPage,
});
