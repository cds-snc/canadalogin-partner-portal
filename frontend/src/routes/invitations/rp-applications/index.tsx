import { createFileRoute } from "@tanstack/react-router";
import { RPApplicationInvitationPage } from "@/features/invitations/pages/RPApplicationInvitationPage";

export const Route = createFileRoute("/invitations/rp-applications/")({
	component: RPApplicationInvitationPage,
});