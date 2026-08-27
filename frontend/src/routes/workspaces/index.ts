import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const WorkspacesPage = lazy(async () => ({
	default: (await import("../../features/workspaces/pages/WorkspacesPage"))
		.WorkspacesPage,
}));

export const Route = createFileRoute("/workspaces/")({
	component: WorkspacesPage,
});
