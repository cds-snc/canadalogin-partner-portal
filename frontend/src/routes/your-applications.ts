import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requirePartnerAccess } from "../features/auth/auth-routing";

export const Route = createFileRoute("/your-applications")({
	beforeLoad: async () => requirePartnerAccess("/your-applications"),
	component: Outlet,
});
