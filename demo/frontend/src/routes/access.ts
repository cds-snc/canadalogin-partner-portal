import { createFileRoute } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "../features/auth/auth-routing";
import { AccessPage } from "../features/access/pages/AccessPage";

export const Route = createFileRoute("/access")({
	beforeLoad: async () => requireAuthenticatedUser("/access"),
	component: AccessPage,
});