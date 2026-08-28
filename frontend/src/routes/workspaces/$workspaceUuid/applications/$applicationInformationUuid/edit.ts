import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireCapability } from "../../../../../features/auth/auth-routing";

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/edit"
)({
	beforeLoad: async ({ params }) => {
		await requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/edit`,
			"application_information_write",
			params.workspaceUuid
		);

		throw redirect({
			params: {
				applicationInformationUuid: params.applicationInformationUuid,
				workspaceUuid: params.workspaceUuid,
			},
			replace: true,
			to: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/details/edit",
		}) as unknown as Error;
	},
});
