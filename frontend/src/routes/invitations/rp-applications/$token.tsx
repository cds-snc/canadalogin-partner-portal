import { createFileRoute, useParams } from "@tanstack/react-router";
import {
	requireAuthenticatedUserWithoutDepartmentSelection,
} from "@/features/auth/auth-routing";
import type { FunctionComponent } from "@/common/types";
import { RPApplicationInvitationPage } from "@/features/invitations/pages/RPApplicationInvitationPage";

export const Route = createFileRoute("/invitations/rp-applications/$token")({
	beforeLoad: async ({ params }) =>
		requireAuthenticatedUserWithoutDepartmentSelection(
			`/invitations/rp-applications/${params.token}`
		),
	component: function RPApplicationInvitationTokenRoute(): FunctionComponent {
		const { token } = useParams({
			from: "/invitations/rp-applications/$token",
		});
		return <RPApplicationInvitationPage key={token} token={token} />;
	},
});