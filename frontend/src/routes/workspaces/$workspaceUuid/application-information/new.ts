import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireAuthenticatedUser } from "../../../../features/auth/auth-routing";

const ApplicationInformationCreatePage = lazy(async () => ({
	default: (
		await import(
			"../../../../features/workspaces/pages/ApplicationInformationCreatePage"
		)
	).ApplicationInformationCreatePage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/application-information/new"
)({
	beforeLoad: async ({ params }) => {
		await requireAuthenticatedUser(
			`/workspaces/${params.workspaceUuid}/application-information/new`
		);

		return {
			backLink: {
				href: `/workspaces/${params.workspaceUuid}/application-information`,
				label: i18n.t("workspaces.appInfoSectionTitle"),
			},
		} satisfies RouteBackLinkContext;
	},
	component: ApplicationInformationCreatePage,
});