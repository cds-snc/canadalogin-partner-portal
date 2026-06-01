import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "../../features/auth/auth-routing";

export const Route = createFileRoute("/workspaces/$workspaceUuid")({
	beforeLoad: async ({ params }) => requireAuthenticatedUser(`/workspaces/${params.workspaceUuid}`),
	component: Outlet,
});