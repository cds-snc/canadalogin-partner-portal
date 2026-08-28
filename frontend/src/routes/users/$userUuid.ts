import { createFileRoute, Outlet } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";

export const Route = createFileRoute("/users/$userUuid")({
	beforeLoad: () =>
		({
			backLink: { href: "/users", label: i18n.t("nav.usersAndAccess") },
			breadcrumbLabel: i18n.t("users.accessBreadcrumb"),
		}) satisfies RouteBackLinkContext,
	component: Outlet,
});
