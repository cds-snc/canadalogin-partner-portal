import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const WorkspaceDetailPage = lazy(async () => ({
	default: (
		await import("../../../features/workspaces/pages/WorkspaceDetailPage")
	).WorkspaceDetailPage,
}));

export const Route = createFileRoute("/workspaces/$workspaceUuid/")({
	component: WorkspaceDetailPage,
});
