import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "../../features/auth/auth-routing";
import { RPApplicationInvitationPage } from "../../features/workspaces/pages/RPApplicationInvitationPage";

export type RPApplicationInvitationSearch = {
	token?: string;
};

export const validateSearch = (search: Record<string, unknown>): RPApplicationInvitationSearch => ({
	token: typeof search.token === "string" ? search.token : undefined,
});

export const Route = createFileRoute("/invitations/rp-applications")({
	beforeLoad: async ({ search }) =>
		requireAuthenticatedUser(
			search.token ? `/invitations/rp-applications?token=${encodeURIComponent(search.token)}` : "/invitations/rp-applications"
		),
	component: RPApplicationInvitationPage,
	validateSearch,
});