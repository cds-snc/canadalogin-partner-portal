import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const WorkspaceApplicationConfigurationPage = lazy(async () => ({
	default: (
		await import("../../../../../../../features/workspaces/pages/WorkspaceApplicationConfigurationPage")
	).WorkspaceApplicationConfigurationPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/configuration"
)({
	component: WorkspaceApplicationConfigurationPage,
});
