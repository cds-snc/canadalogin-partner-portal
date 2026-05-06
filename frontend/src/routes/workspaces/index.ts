import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireAuthenticatedUser } from "../../features/auth/auth-routing";

const WorkspacesPage = lazy(async () => ({
	default: (await import("../../features/workspaces/pages/WorkspacesPage"))
		.WorkspacesPage,
}));

export const Route = createFileRoute("/workspaces/")({
	beforeLoad: async () => requireAuthenticatedUser("/workspaces"),
	component: WorkspacesPage,
});
