import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/features/account/pages/AccountPage";
import { requireAuthenticatedUser } from "@/features/auth/auth-routing";

export const Route = createFileRoute("/account")({
	beforeLoad: async ({ location }) =>
		requireAuthenticatedUser(location.pathname),
	component: AccountPage,
});
