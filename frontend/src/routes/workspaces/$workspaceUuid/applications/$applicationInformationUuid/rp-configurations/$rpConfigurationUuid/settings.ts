import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "../../../../../../../features/auth/auth-routing";

const ApplicationRPConfigurationSettingsPage = lazy(async () => ({
	default: (
		await import("../../../../../../../features/workspaces/pages/ApplicationRPConfigurationSettingsPage")
	).ApplicationRPConfigurationSettingsPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/settings"
)({
	beforeLoad: async ({ params }) =>
		requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/rp-configurations/${params.rpConfigurationUuid}/settings`,
			"rp_configuration_write",
			params.workspaceUuid
		),
	component: ApplicationRPConfigurationSettingsPage,
});
