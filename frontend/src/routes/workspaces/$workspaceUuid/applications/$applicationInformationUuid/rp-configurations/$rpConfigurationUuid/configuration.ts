import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "../../../../../../../features/auth/auth-routing";

const WorkspaceApplicationConfigurationPage = lazy(async () => ({
	default: (
		await import("../../../../../../../features/workspaces/pages/WorkspaceApplicationConfigurationPage")
	).WorkspaceApplicationConfigurationPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/configuration"
)({
	beforeLoad: async ({ params }) =>
		requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/rp-configurations/${params.rpConfigurationUuid}/configuration`,
			"rp_configuration_read",
			params.workspaceUuid
		),
	component: WorkspaceApplicationConfigurationPage,
});
