import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireCapability } from "@/features/auth/auth-routing";

export const Route = createFileRoute("/reports")({
	beforeLoad: async ({ location }) =>
		requireCapability(location.pathname, "mau_report_read"),
	component: Outlet,
});
