import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "../../../../../features/auth/auth-routing";

const WorkspaceApplicationEditPage = lazy(async () => ({
	default: (
		await import("../../../../../features/workspaces/pages/WorkspaceApplicationEditPage")
	).WorkspaceApplicationEditPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$rpApplicationUuid/edit"
)({
	beforeLoad: async ({ params }) =>
		requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.rpApplicationUuid}/edit`,
			"rp_configuration_write",
			params.workspaceUuid
		),
	component: WorkspaceApplicationEditPage,
});
