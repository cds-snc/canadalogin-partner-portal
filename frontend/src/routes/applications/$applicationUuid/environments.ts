import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { z } from "zod";
import i18n from "../../../common/i18n";
import { requireAuthenticatedUser } from "../../../features/auth/auth-routing";
import type { RouteBackLinkContext } from "../../../types/route-breadcrumbs";

const EnvironmentsPage = lazy(async () => ({
	default: (await import("../../../features/application-environments/pages/EnvironmentsPage"))
		.EnvironmentsPage,
}));

const searchSchema = z.object({
	page: z.coerce.number().int().positive().optional(),
});

export const Route = createFileRoute(
	"/applications/$applicationUuid/environments"
)({
	beforeLoad: async ({ params }) => {
		await requireAuthenticatedUser(
			`/applications/${params.applicationUuid}/environments`
		);

		return {
			backLink: {
				href: "#",
				label: i18n.t("applicationEnvironments.applications"),
				showBackLabel: false,
			},
		} satisfies RouteBackLinkContext;
	},
	component: EnvironmentsPage,
	validateSearch: searchSchema,
});