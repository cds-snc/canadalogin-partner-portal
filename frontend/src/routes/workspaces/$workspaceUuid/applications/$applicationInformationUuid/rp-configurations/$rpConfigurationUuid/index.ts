import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const ApplicationRPConfigurationDetailPage = lazy(async () => ({
	default: (
		await import("../../../../../../../features/workspaces/pages/ApplicationRPConfigurationDetailPage")
	).ApplicationRPConfigurationDetailPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/"
)({
	component: ApplicationRPConfigurationDetailPage,
});
