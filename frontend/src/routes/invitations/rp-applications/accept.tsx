import { createFileRoute } from "@tanstack/react-router";
import type { FunctionComponent } from "@/common/types";
import { requireAuthenticatedUserWithoutDepartmentSelection } from "@/features/auth/auth-routing";
import { RPApplicationInvitationPage } from "@/features/invitations/pages/RPApplicationInvitationPage";

const acceptancePath = "/invitations/rp-applications/accept";

export const Route = createFileRoute("/invitations/rp-applications/accept")({
	beforeLoad: async () =>
		requireAuthenticatedUserWithoutDepartmentSelection(acceptancePath),
	component: function RPApplicationInvitationAcceptRoute(): FunctionComponent {
		return <RPApplicationInvitationPage />;
	},
});
