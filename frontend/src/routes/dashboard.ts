import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireAuthenticatedUser } from "../features/auth/auth-routing";

const DashboardPage = lazy(async () => ({
	default: (await import("../features/dashboard/pages/DashboardPage"))
		.DashboardPage,
}));

export const Route = createFileRoute("/dashboard")({
	beforeLoad: async () => requireAuthenticatedUser("/dashboard"),
	component: DashboardPage,
});
