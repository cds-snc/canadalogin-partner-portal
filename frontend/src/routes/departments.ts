import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireCapability } from "../features/auth/auth-routing";

const DepartmentsPage = lazy(async () => ({
	default: (await import("../features/departments/pages/DepartmentsPage"))
		.DepartmentsPage,
}));

export const Route = createFileRoute("/departments")({
	beforeLoad: async () => {
		await requireCapability("/departments", "platform_governance");

		return {
			backLink: { href: "/", label: i18n.t("nav.home") },
		} satisfies RouteBackLinkContext;
	},
	component: DepartmentsPage,
});
