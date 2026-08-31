import { createFileRoute } from "@tanstack/react-router";
import { Home } from "../pages/Home";
import { redirectAuthenticatedUser } from "../features/auth/auth-routing";

export const Route = createFileRoute("/")({
	beforeLoad: async () => redirectAuthenticatedUser("/your-applications"),
	component: Home,
});
