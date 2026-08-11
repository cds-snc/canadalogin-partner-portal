import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireSuperuser } from "../features/auth/auth-routing";

export const Route = createFileRoute("/onboarding-oversight")({
	beforeLoad: async () => requireSuperuser("/onboarding-oversight"),
	component: Outlet,
});
