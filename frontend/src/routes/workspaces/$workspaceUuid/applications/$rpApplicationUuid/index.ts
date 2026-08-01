import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const WorkspaceApplicationDetailPage = lazy(async () => ({
	default: (
		await import("../../../../../features/workspaces/pages/WorkspaceApplicationDetailPage")
	).WorkspaceApplicationDetailPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$rpApplicationUuid/"
)({
	component: WorkspaceApplicationDetailPage,
});
