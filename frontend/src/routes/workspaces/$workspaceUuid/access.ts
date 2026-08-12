import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "../../../features/auth/auth-routing";

const WorkspaceAccessPage = lazy(async () => ({
	default: (
		await import("../../../features/workspaces/pages/WorkspaceMembersPage")
	).WorkspaceMembersPage,
}));

export const Route = createFileRoute("/workspaces/$workspaceUuid/access")({
	beforeLoad: async ({ params }) =>
		requireCapability(
			`/workspaces/${params.workspaceUuid}/access`,
			"partner_staff_assignment",
			params.workspaceUuid
		),
	component: WorkspaceAccessPage,
});
