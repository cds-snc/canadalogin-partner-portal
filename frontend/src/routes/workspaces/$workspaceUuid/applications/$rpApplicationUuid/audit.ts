import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "../../../../../features/auth/auth-routing";

const WorkspaceApplicationAuditPage = lazy(async () => ({
	default: (
		await import("../../../../../features/workspaces/pages/WorkspaceApplicationAuditPage")
	).WorkspaceApplicationAuditPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$rpApplicationUuid/audit"
)({
	beforeLoad: async ({ params }) =>
		requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.rpApplicationUuid}/audit`,
			"partner_audit_read",
			params.workspaceUuid
		),
	component: WorkspaceApplicationAuditPage,
});
