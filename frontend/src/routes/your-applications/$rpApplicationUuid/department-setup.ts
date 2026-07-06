import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { z } from "zod";
import i18n from "@/common/i18n";
import type { RouteBreadcrumbContext } from "@/types/route-breadcrumbs";
import { requireAuthenticatedUser } from "../../../features/auth/auth-routing";

const RPApplicationDepartmentSetupPage = lazy(async () => ({
	default: (
		await import("../../../features/your-applications/pages/DepartmentSetupPage")
	).DepartmentSetupPage,
}));

const departmentSetupSearchSchema = z.object({
	redirect: z.string().optional(),
});

export const Route = createFileRoute(
	"/your-applications/$rpApplicationUuid/department-setup"
)({
	validateSearch: departmentSetupSearchSchema,
	beforeLoad: async ({ params }) => {
		await requireAuthenticatedUser(
			`/your-applications/${params.rpApplicationUuid}/department-setup`
		);

		return {
			breadcrumbs: [
				{ href: "/", label: i18n.t("nav.home") },
				{ href: "/your-applications", label: i18n.t("nav.dashboard") },
				{
					href: `/your-applications/${params.rpApplicationUuid}/department-setup`,
					label: i18n.t("rpDepartmentSetup.title"),
				},
			],
		} satisfies RouteBreadcrumbContext;
	},
	component: RPApplicationDepartmentSetupPage,
});
