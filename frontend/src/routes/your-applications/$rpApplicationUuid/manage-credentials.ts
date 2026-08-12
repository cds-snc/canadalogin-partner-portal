import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAccessibleRPApplicationCapability } from "../../../features/auth/auth-routing";

export const Route = createFileRoute(
	"/your-applications/$rpApplicationUuid/manage-credentials"
)({
	beforeLoad: async ({ params }) => {
		const { application } = await requireAccessibleRPApplicationCapability(
			`/your-applications/${params.rpApplicationUuid}/manage-credentials`,
			params.rpApplicationUuid,
			"partner_secret_lifecycle"
		);
		throw redirect({
			params: {
				rpApplicationUuid: params.rpApplicationUuid,
				workspaceUuid: application.workspaceUuid,
			},
			replace: true,
			to: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid/manage-credentials",
		}) as unknown as Error;
	},
});
