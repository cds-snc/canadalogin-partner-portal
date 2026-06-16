import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "../../../features/auth/auth-routing";
import { CurrentUserRPOAuthSetupPage } from "../../../features/rp-applications/pages/CurrentUserRPOAuthSetupPage";

export const Route = createFileRoute("/rp-applications/mine/$rpApplicationUuid")
	({
		beforeLoad: async ({ params }) =>
			requireAuthenticatedUser(
				`/rp-applications/mine/${params.rpApplicationUuid}`
			),
		component: CurrentUserRPOAuthSetupPage,
	});
