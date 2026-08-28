import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";

const InviteUserPage = lazy(async () => ({
	default: (await import("../../features/users/pages/InviteUserPage"))
		.InviteUserPage,
}));

export const Route = createFileRoute("/users/invite")({
	beforeLoad: () =>
		({
			backLink: { href: "/users", label: i18n.t("nav.usersAndAccess") },
			breadcrumbLabel: i18n.t("users.inviteTitle"),
		}) satisfies RouteBackLinkContext,
	component: InviteUserPage,
});
