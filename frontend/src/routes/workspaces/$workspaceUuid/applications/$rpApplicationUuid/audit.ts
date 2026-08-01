import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const WorkspaceApplicationAuditPage = lazy(async () => ({
	default: (
		await import("../../../../../features/workspaces/pages/WorkspaceApplicationAuditPage")
	).WorkspaceApplicationAuditPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$rpApplicationUuid/audit"
)({
	component: WorkspaceApplicationAuditPage,
});
