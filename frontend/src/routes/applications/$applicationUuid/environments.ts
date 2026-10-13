import { Outlet, createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import i18n from "../../../common/i18n";
import { requireAuthenticatedUser } from "../../../features/auth/auth-routing";
import type { RouteBackLinkContext } from "../../../types/route-breadcrumbs";

const searchSchema = z.object({
	connect: z.coerce.boolean().optional(),
	page: z.coerce.number().int().positive().optional(),
	requestProduction: z.coerce.boolean().optional(),
	sourceEnvironmentUuid: z.string().uuid().optional(),
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
				href: "/applications",
				label: i18n.t("applicationEnvironments.applications"),
				showBackLabel: false,
			},
		} satisfies RouteBackLinkContext;
	},
	component: Outlet,
	validateSearch: searchSchema,
});
