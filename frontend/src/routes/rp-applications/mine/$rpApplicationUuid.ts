import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "../../../features/auth/auth-routing";

export const Route = createFileRoute(
	"/rp-applications/mine/$rpApplicationUuid"
)({
	beforeLoad: async ({ params }) =>
		requireAuthenticatedUser(
			`/rp-applications/mine/${params.rpApplicationUuid}`
		),
	component: Outlet,
});
