import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const WorkspaceApplicationCreatePage = lazy(async () => ({
	default: (
		await import("../../../../features/workspaces/pages/WorkspaceApplicationCreatePage")
	).WorkspaceApplicationCreatePage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/new"
)({
	component: WorkspaceApplicationCreatePage,
});
