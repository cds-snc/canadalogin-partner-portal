import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";

const UserAccessPage = lazy(async () => ({
	default: (await import("../../features/users/pages/UserAccessPage"))
		.UserAccessPage,
}));

export const Route = createFileRoute("/users/$userUuid")({
	beforeLoad: () =>
		({
			backLink: { href: "/users", label: i18n.t("nav.usersAndAccess") },
			breadcrumbLabel: i18n.t("users.accessBreadcrumb"),
		}) satisfies RouteBackLinkContext,
	component: UserAccessPage,
});
