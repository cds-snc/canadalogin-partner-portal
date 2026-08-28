import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "../../../../../../../features/auth/auth-routing";

const ApplicationRPConfigurationCopyPage = lazy(async () => ({
	default: (
		await import("../../../../../../../features/workspaces/pages/ApplicationRPConfigurationCopyPage")
	).ApplicationRPConfigurationCopyPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/copy"
)({
	beforeLoad: async ({ params }) =>
		requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/rp-configurations/${params.rpConfigurationUuid}/copy`,
			"rp_configuration_write",
			params.workspaceUuid
		),
	component: ApplicationRPConfigurationCopyPage,
});
