import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireCapability } from "../../../../../features/auth/auth-routing";

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/settings"
)({
	beforeLoad: async ({ params }) => {
		await requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/settings`,
			"application_information_write",
			params.workspaceUuid
		);

		throw redirect({
			params: {
				applicationInformationUuid: params.applicationInformationUuid,
				workspaceUuid: params.workspaceUuid,
			},
			replace: true,
			to: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/delete",
		}) as unknown as Error;
	},
});
