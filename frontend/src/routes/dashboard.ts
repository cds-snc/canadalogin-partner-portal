import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBreadcrumbContext } from "@/types/route-breadcrumbs";
import { requireAuthenticatedUser } from "../features/auth/auth-routing";

const DashboardPage = lazy(async () => ({
	default: (await import("../features/dashboard/pages/DashboardPage"))
		.DashboardPage,
}));

export const Route = createFileRoute("/dashboard")({
	beforeLoad: async () => {
		await requireAuthenticatedUser("/dashboard");

		return {
			breadcrumbs: [
				{ href: "/", label: i18n.t("nav.home") },
				{ href: "/dashboard", label: i18n.t("nav.dashboard") },
			],
		} satisfies RouteBreadcrumbContext;
	},
	component: DashboardPage,
});
