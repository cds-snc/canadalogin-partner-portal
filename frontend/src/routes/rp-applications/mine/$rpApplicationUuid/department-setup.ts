import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { z } from "zod";
import i18n from "@/common/i18n";
import type { RouteBreadcrumbContext } from "@/types/route-breadcrumbs";
import { requireAuthenticatedUser } from "../../../../features/auth/auth-routing";

const RPApplicationDepartmentSetupPage = lazy(async () => ({
	default: (
		await import("../../../../features/rp-applications/pages/RPApplicationDepartmentSetupPage")
	).RPApplicationDepartmentSetupPage,
}));

const departmentSetupSearchSchema = z.object({
	redirect: z.string().optional(),
});

export const Route = createFileRoute(
	"/rp-applications/mine/$rpApplicationUuid/department-setup"
)({
	validateSearch: departmentSetupSearchSchema,
	beforeLoad: async ({ params }) => {
		await requireAuthenticatedUser(
			`/rp-applications/mine/${params.rpApplicationUuid}/department-setup`
		);

		return {
			breadcrumbs: [
				{ href: "/", label: i18n.t("nav.home") },
				{ href: "/dashboard", label: i18n.t("nav.dashboard") },
				{
					href: `/rp-applications/mine/${params.rpApplicationUuid}/department-setup`,
					label: i18n.t("rpDepartmentSetup.title"),
				},
			],
		} satisfies RouteBreadcrumbContext;
	},
	component: RPApplicationDepartmentSetupPage,
});
