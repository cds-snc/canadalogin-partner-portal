import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireAuthenticatedUser } from "../../../../../features/auth/auth-routing";

const RPApplicationUsagePage = lazy(async () => ({
	default: (
		await import("../../../../../features/workspaces/pages/RPApplicationUsagePage")
	).RPApplicationUsagePage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage"
)({
	beforeLoad: async ({ params }) =>
		requireAuthenticatedUser(
			`/workspaces/${params.workspaceUuid}/applications/${params.rpApplicationUuid}/usage`
		),
	component: RPApplicationUsagePage,
});
