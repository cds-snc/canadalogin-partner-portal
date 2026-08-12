import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAccessibleRPApplicationCapability } from "../../../features/auth/auth-routing";

export const Route = createFileRoute(
	"/your-applications/$rpApplicationUuid/mau-report"
)({
	beforeLoad: async ({ params }) => {
		const { application } = await requireAccessibleRPApplicationCapability(
			`/your-applications/${params.rpApplicationUuid}/mau-report`,
			params.rpApplicationUuid,
			"mau_report_read"
		);
		throw redirect({
			params: {
				rpApplicationUuid: params.rpApplicationUuid,
				workspaceUuid: application.workspaceUuid,
			},
			replace: true,
			to: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage",
		}) as unknown as Error;
	},
});
