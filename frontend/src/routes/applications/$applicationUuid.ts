import { Outlet, createFileRoute } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import { requireAuthenticatedUser } from "../../features/auth/auth-routing";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";

export const Route = createFileRoute("/applications/$applicationUuid")({
	beforeLoad: async ({ params }) => {
		await requireAuthenticatedUser(`/applications/${params.applicationUuid}`);

		return {
			backLink: {
				href: "/applications",
				label: i18n.t("nav.applications"),
			},
		} satisfies RouteBackLinkContext;
	},
	component: Outlet,
});