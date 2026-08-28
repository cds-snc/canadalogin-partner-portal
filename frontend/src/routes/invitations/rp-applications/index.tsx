import { createFileRoute } from "@tanstack/react-router";
import { RPApplicationInvitationPreparePage } from "@/features/invitations/pages/RPApplicationInvitationPreparePage";

export const Route = createFileRoute("/invitations/rp-applications/")({
	component: RPApplicationInvitationPreparePage,
});
