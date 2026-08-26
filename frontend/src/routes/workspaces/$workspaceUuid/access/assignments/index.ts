import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const WorkspaceAccessAssignmentsPage = lazy(async () => ({
	default: (
		await import("@/features/workspaces/pages/WorkspaceAccessAssignmentsPage")
	).WorkspaceAccessAssignmentsPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/access/assignments/"
)({ component: WorkspaceAccessAssignmentsPage });
