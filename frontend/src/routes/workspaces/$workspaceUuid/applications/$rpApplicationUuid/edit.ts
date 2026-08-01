import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const WorkspaceApplicationEditPage = lazy(async () => ({
	default: (
		await import("../../../../../features/workspaces/pages/WorkspaceApplicationEditPage")
	).WorkspaceApplicationEditPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$rpApplicationUuid/edit"
)({
	component: WorkspaceApplicationEditPage,
});
