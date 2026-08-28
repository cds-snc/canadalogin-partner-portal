import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";

const UserGlobalAccessPage = lazy(async () => ({
	default: (await import("../../../features/users/pages/UserGlobalAccessPage"))
		.UserGlobalAccessPage,
}));

export const Route = createFileRoute("/users/$userUuid/global-access")({
	beforeLoad: ({ params }) =>
		({
			backLink: {
				href: `/users/${params.userUuid}`,
				label: i18n.t("users.backToSelectedUserAction"),
			},
			breadcrumbLabel: i18n.t("users.globalAccessTitle"),
		}) satisfies RouteBackLinkContext,
	component: UserGlobalAccessPage,
});
