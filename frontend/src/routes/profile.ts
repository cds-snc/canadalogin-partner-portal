import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "../features/auth/auth-routing";
import { ProfilePage } from "../features/auth/pages/ProfilePage";

export const Route = createFileRoute("/profile")({
	beforeLoad: async () => requireAuthenticatedUser("/profile"),
	component: ProfilePage,
});
