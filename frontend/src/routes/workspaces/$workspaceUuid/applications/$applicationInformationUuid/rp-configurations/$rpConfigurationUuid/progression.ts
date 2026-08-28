import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireCapability } from "../../../../../../../features/auth/auth-routing";

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/progression"
)({
	beforeLoad: async ({ params }) => {
		await requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/rp-configurations/${params.rpConfigurationUuid}/progression`,
			"rp_configuration_write",
			params.workspaceUuid
		);
		throw redirect({
			params,
			replace: true,
			to: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/copy",
		}) as unknown as Error;
	},
});
