import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "../../../features/auth/auth-routing";
import { WorkspaceDetailPage } from "../../../features/workspaces/pages/WorkspaceDetailPage";

export const Route = createFileRoute("/workspaces/$workspaceUuid/")({
	beforeLoad: async ({ params }) => requireAuthenticatedUser(`/workspaces/${params.workspaceUuid}`),
	component: WorkspaceDetailPage,
});