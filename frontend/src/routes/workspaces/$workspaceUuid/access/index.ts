import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const WorkspaceAccessPage = lazy(async () => ({
	default: (await import("@/features/workspaces/pages/WorkspaceAccessPage"))
		.WorkspaceAccessPage,
}));

export const Route = createFileRoute("/workspaces/$workspaceUuid/access/")({
	component: WorkspaceAccessPage,
});
