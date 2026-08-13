import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "../../../../../../../features/auth/auth-routing";

const WorkspaceApplicationAuditPage = lazy(async () => ({
	default: (
		await import("../../../../../../../features/workspaces/pages/WorkspaceApplicationAuditPage")
	).WorkspaceApplicationAuditPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/audit"
)({
	beforeLoad: async ({ params }) =>
		requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/rp-configurations/${params.rpConfigurationUuid}/audit`,
			"partner_audit_read",
			params.workspaceUuid
		),
	component: WorkspaceApplicationAuditPage,
});
