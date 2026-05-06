import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireAuthenticatedUser } from "../../../../../features/auth/auth-routing";

const RPApplicationDeveloperInvitationsPage = lazy(async () => ({
	default: (
		await import(
			"../../../../../features/workspaces/pages/RPApplicationDeveloperInvitationsPage"
		)
	).RPApplicationDeveloperInvitationsPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$rpApplicationUuid/developers"
)({
	beforeLoad: async ({ params }) =>
		requireAuthenticatedUser(
			`/workspaces/${params.workspaceUuid}/applications/${params.rpApplicationUuid}/developers`
		),
	component: RPApplicationDeveloperInvitationsPage,
});