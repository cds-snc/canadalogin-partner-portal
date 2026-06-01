import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "../../../../features/auth/auth-routing";
import { CurrentUserRPApplicationDetailPage } from "../../../../features/workspaces/pages/CurrentUserRPApplicationDetailPage";

export const Route = createFileRoute("/rp-applications/mine/$rpApplicationUuid")({
	beforeLoad: async ({ params }) => requireAuthenticatedUser(`/rp-applications/mine/${params.rpApplicationUuid}`),
	component: CurrentUserRPApplicationDetailPage,
});