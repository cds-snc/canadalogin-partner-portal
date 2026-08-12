import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "../../../../features/auth/auth-routing";

const WorkspaceApplicationCreatePage = lazy(async () => ({
	default: (
		await import("../../../../features/workspaces/pages/WorkspaceApplicationCreatePage")
	).WorkspaceApplicationCreatePage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/new"
)({
	beforeLoad: async ({ params }) =>
		requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/new`,
			"rp_configuration_write",
			params.workspaceUuid
		),
	component: WorkspaceApplicationCreatePage,
});
