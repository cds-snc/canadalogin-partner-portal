import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "../features/auth/auth-routing";

export const Route = createFileRoute("/your-applications")({
	beforeLoad: async () => requireAuthenticatedUser("/your-applications"),
	component: Outlet,
});
