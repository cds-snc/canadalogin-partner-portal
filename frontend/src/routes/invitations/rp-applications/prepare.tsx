import { createFileRoute } from "@tanstack/react-router";
import { RPApplicationInvitationPreparePage } from "@/features/invitations/pages/RPApplicationInvitationPreparePage";

export const Route = createFileRoute("/invitations/rp-applications/prepare")({
	component: RPApplicationInvitationPreparePage,
});
