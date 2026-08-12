import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "../../../../../features/auth/auth-routing";

const WorkspaceApplicationConfigurationPage = lazy(async () => ({
	default: (
		await import(
			"../../../../../features/workspaces/pages/WorkspaceApplicationConfigurationPage"
		)
	).WorkspaceApplicationConfigurationPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$rpApplicationUuid/configuration"
)({
	beforeLoad: async ({ params }) =>
		requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.rpApplicationUuid}/configuration`,
			"rp_configuration_read",
			params.workspaceUuid
		),
	component: WorkspaceApplicationConfigurationPage,
});
