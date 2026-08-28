import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireCapability } from "../features/auth/auth-routing";

export const Route = createFileRoute("/onboarding-oversight")({
	beforeLoad: async () =>
		requireCapability("/onboarding-oversight", "onboarding_oversight_read"),
	component: Outlet,
});
