import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireAuthenticatedUser } from "../../../features/auth/auth-routing";

const WorkspaceDetailPage = lazy(async () => ({
	default: (
		await import("../../../features/workspaces/pages/WorkspaceDetailPage")
	).WorkspaceDetailPage,
}));

export const Route = createFileRoute("/workspaces/$workspaceUuid/")({
	beforeLoad: async ({ params }) =>
		requireAuthenticatedUser(`/workspaces/${params.workspaceUuid}`),
	component: WorkspaceDetailPage,
});
