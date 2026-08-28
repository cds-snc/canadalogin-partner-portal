import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const ApplicationRPConfigurationCreatePage = lazy(async () => ({
	default: (
		await import("../../../../../../features/workspaces/pages/ApplicationRPConfigurationCreatePage")
	).ApplicationRPConfigurationCreatePage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/new"
)({
	component: ApplicationRPConfigurationCreatePage,
});
