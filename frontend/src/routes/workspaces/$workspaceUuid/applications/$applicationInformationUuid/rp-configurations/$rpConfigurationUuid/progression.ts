import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "../../../../../../../features/auth/auth-routing";

const ApplicationRPConfigurationProgressionPage = lazy(async () => ({
	default: (
		await import("../../../../../../../features/workspaces/pages/ApplicationRPConfigurationProgressionPage")
	).ApplicationRPConfigurationProgressionPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/progression"
)({
	beforeLoad: async ({ params }) =>
		requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/rp-configurations/${params.rpConfigurationUuid}/progression`,
			"rp_configuration_write",
			params.workspaceUuid
		),
	component: ApplicationRPConfigurationProgressionPage,
});
