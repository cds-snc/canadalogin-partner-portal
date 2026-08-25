import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const UserWorkspaceAccessPage = lazy(async () => ({
	default: (
		await import("../../../../features/users/pages/UserWorkspaceAccessPage")
	).UserWorkspaceAccessPage,
}));

export const Route = createFileRoute("/users/$userUuid/workspace-access/")({
	component: UserWorkspaceAccessPage,
});
