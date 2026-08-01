import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const WorkspaceApplicationUsagePage = lazy(async () => ({
	default: (
		await import("../../../../../features/workspaces/pages/WorkspaceApplicationUsagePage")
	).WorkspaceApplicationUsagePage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage"
)({
	component: WorkspaceApplicationUsagePage,
});
