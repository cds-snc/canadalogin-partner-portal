import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { z } from "zod";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
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
	"/applications/$applicationUuid/department-setup"
)({
	validateSearch: departmentSetupSearchSchema,
	beforeLoad: async ({ params }) => {
		await requireAuthenticatedUser(
			`/applications/${params.applicationUuid}/department-setup`
		);

		return {
			backLink: { href: "/applications", label: i18n.t("nav.applications") },
		} satisfies RouteBackLinkContext;
	},
	component: RPApplicationDepartmentSetupPage,
});