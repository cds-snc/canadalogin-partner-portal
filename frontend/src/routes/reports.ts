import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireAnyCapability } from "@/features/auth/auth-routing";

const REPORT_CAPABILITIES = [
	"onboarding_oversight_read",
	"aggregate_report_read",
	"mau_report_read",
] as const;

export const Route = createFileRoute("/reports")({
	beforeLoad: async ({ location }) =>
		requireAnyCapability(location.pathname, REPORT_CAPABILITIES),
	component: Outlet,
});
