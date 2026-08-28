import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "../../../../../../../../features/auth/auth-routing";

const ApplicationRPConfigurationPartnerEnvironmentEditPage = lazy(async () => ({
	default: (
		await import("../../../../../../../../features/workspaces/pages/ApplicationRPConfigurationPartnerEnvironmentEditPage")
	).ApplicationRPConfigurationPartnerEnvironmentEditPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/partner-environment/edit"
)({
	beforeLoad: async ({ params }) =>
		requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/rp-configurations/${params.rpConfigurationUuid}/partner-environment/edit`,
			"rp_configuration_write",
			params.workspaceUuid
		),
	component: ApplicationRPConfigurationPartnerEnvironmentEditPage,
});
