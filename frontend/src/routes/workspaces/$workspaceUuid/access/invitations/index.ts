import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const WorkspaceAccessInvitationsPage = lazy(async () => ({
	default: (
		await import("@/features/workspaces/pages/WorkspaceAccessInvitationsPage")
	).WorkspaceAccessInvitationsPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/access/invitations/"
)({ component: WorkspaceAccessInvitationsPage });
