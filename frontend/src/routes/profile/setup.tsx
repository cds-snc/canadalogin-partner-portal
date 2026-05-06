import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "../../features/auth/auth-routing";
import ProfileSetup from "../../features/auth/pages/ProfileSetup";

export const Route = createFileRoute("/profile/setup")({
	beforeLoad: async () => requireAuthenticatedUser("/profile/setup"),
	component: ProfileSetup,
});
