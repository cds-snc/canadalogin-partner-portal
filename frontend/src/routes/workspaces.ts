import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireWorkspaceRead } from "../features/auth/auth-routing";

type WorkspacesSearch = {
	deleted?: "1";
};

const validateSearch = (search: Record<string, unknown>): WorkspacesSearch => ({
	deleted: search["deleted"] === "1" ? "1" : undefined,
});

export const Route = createFileRoute("/workspaces")({
	beforeLoad: async () => requireWorkspaceRead("/workspaces"),
	component: Outlet,
	validateSearch,
});
