import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";

const UserInvitationsPage = lazy(async () => ({
	default: (await import("../../../features/users/pages/UserInvitationsPage"))
		.UserInvitationsPage,
}));

export const Route = createFileRoute("/users/$userUuid/invitations")({
	beforeLoad: ({ params }) =>
		({
			backLink: {
				href: `/users/${params.userUuid}`,
				label: i18n.t("users.backToSelectedUserAction"),
			},
			breadcrumbLabel: i18n.t("users.pendingInvitationsTitle"),
		}) satisfies RouteBackLinkContext,
	component: UserInvitationsPage,
});
