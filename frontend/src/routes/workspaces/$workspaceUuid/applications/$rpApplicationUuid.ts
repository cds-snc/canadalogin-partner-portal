import { Outlet, createFileRoute } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireAuthenticatedUser } from "../../../../features/auth/auth-routing";

type WorkspaceApplicationDetailSearch = {
	created?: "1";
	updated?: "1";
};

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$rpApplicationUuid"
)({
	beforeLoad: async ({ params }) => {
		await requireAuthenticatedUser(
			`/workspaces/${params.workspaceUuid}/applications/${params.rpApplicationUuid}`
		);

		return {
			backLink: {
				href: `/workspaces/${params.workspaceUuid}/applications`,
				label: i18n.t("workspaces.applicationsSectionTitle"),
			},
		} satisfies RouteBackLinkContext;
	},
	component: Outlet,
	validateSearch: (search): WorkspaceApplicationDetailSearch => ({
		created: search["created"] === "1" ? "1" : undefined,
		updated: search["updated"] === "1" ? "1" : undefined,
	}),
});
