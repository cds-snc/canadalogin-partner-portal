import { createFileRoute } from "@tanstack/react-router";
import { WorkspacesPage } from "../../features/workspaces/pages/WorkspacesPage";
import { requireAuthenticatedUser } from "../../features/auth/auth-routing";

export const Route = createFileRoute("/workspaces/")({
	beforeLoad: async () => requireAuthenticatedUser("/workspaces"),
	component: WorkspacesPage,
});