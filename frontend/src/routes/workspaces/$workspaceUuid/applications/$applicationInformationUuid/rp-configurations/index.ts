import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const ApplicationInformationRPConfigurationsPage = lazy(async () => ({
	default: (
		await import("../../../../../../features/workspaces/pages/ApplicationInformationRPConfigurationsPage")
	).ApplicationInformationRPConfigurationsPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/"
)({
	component: ApplicationInformationRPConfigurationsPage,
});
