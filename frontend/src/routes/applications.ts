import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireAuthenticatedUser } from "../features/auth/auth-routing";

export const Route = createFileRoute("/applications")({
	beforeLoad: async () => requireAuthenticatedUser("/applications"),
	component: Outlet,
});