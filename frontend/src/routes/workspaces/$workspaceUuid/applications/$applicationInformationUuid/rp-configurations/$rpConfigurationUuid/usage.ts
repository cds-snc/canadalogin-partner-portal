import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "../../../../../../../features/auth/auth-routing";

const WorkspaceApplicationUsagePage = lazy(async () => ({
	default: (
		await import("../../../../../../../features/workspaces/pages/WorkspaceApplicationUsagePage")
	).WorkspaceApplicationUsagePage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/usage"
)({
	beforeLoad: async ({ params }) =>
		requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/rp-configurations/${params.rpConfigurationUuid}/usage`,
			"mau_report_read",
			params.workspaceUuid
		),
	component: WorkspaceApplicationUsagePage,
});
