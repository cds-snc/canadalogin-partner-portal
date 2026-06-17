import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBreadcrumbContext } from "@/types/route-breadcrumbs";
import { requireSuperuser } from "../features/auth/auth-routing";

const DepartmentsPage = lazy(async () => ({
	default: (await import("../features/departments/pages/DepartmentsPage"))
		.DepartmentsPage,
}));

export const Route = createFileRoute("/departments")({
	beforeLoad: async () => {
		await requireSuperuser("/departments");

		return {
			breadcrumbs: [
				{ href: "/", label: i18n.t("nav.home") },
				{ href: "/departments", label: i18n.t("nav.departments") },
			],
		} satisfies RouteBreadcrumbContext;
	},
	component: DepartmentsPage,
});
