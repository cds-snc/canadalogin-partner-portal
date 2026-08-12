import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAccessibleRPApplication } from "@/fetch/rp-applications";

export const Route = createFileRoute("/your-applications/$rpApplicationUuid/")({
	beforeLoad: async ({ params }) => {
		const application = await getAccessibleRPApplication(
			params.rpApplicationUuid
		);
		throw redirect({
			params: {
				rpApplicationUuid: params.rpApplicationUuid,
				workspaceUuid: application.workspaceUuid,
			},
			replace: true,
			to: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid",
		}) as unknown as Error;
	},
});
