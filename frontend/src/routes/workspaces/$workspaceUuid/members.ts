import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireCapability } from "../../../features/auth/auth-routing";

export const Route = createFileRoute("/workspaces/$workspaceUuid/members")({
	beforeLoad: async ({ params }) => {
		await requireCapability(
			`/workspaces/${params.workspaceUuid}/members`,
			"partner_staff_assignment",
			params.workspaceUuid
		);

		throw redirect({
			params: { workspaceUuid: params.workspaceUuid },
			replace: true,
			to: "/workspaces/$workspaceUuid/access",
		}) as unknown as Error;
	},
});
