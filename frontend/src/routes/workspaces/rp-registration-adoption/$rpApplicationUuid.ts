import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";

const RPRegistrationAdoptionDetailPage = lazy(async () => ({
	default: (
		await import("../../../features/workspaces/pages/RPRegistrationAdoptionDetailPage")
	).RPRegistrationAdoptionDetailPage,
}));

export const Route = createFileRoute(
	"/workspaces/rp-registration-adoption/$rpApplicationUuid"
)({
	beforeLoad: () =>
		({
			backLink: {
				href: "/workspaces/rp-registration-adoption",
				label: i18n.t("rpRegistrationAdoption.title"),
			},
			breadcrumbLabel: i18n.t("rpRegistrationAdoption.detailBreadcrumb"),
		}) satisfies RouteBackLinkContext,
	component: RPRegistrationAdoptionDetailPage,
});
