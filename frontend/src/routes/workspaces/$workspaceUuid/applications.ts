import { Outlet, createFileRoute } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireAuthenticatedUser } from "../../../features/auth/auth-routing";

type WorkspaceApplicationsListSearch = {
	deleted?: "1";
};

const validateSearch = (
	search: Record<string, unknown>
): WorkspaceApplicationsListSearch => ({
	deleted: search["deleted"] === "1" ? "1" : undefined,
});

export const Route = createFileRoute("/workspaces/$workspaceUuid/applications")(
	{
		beforeLoad: async ({ params }) => {
			await requireAuthenticatedUser(
				`/workspaces/${params.workspaceUuid}/applications`
			);

			return {
				backLink: {
					href: `/workspaces/${params.workspaceUuid}`,
					label: i18n.t("workspaces.workspaceLabel"),
				},
			} satisfies RouteBackLinkContext;
		},
		component: Outlet,
		validateSearch,
	}
);
