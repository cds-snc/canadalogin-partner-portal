import { Outlet, createFileRoute } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireApplicationInformationRead } from "../../../features/auth/auth-routing";

type WorkspaceApplicationsListSearch = {
	created?: "1";
	deleted?: "1";
	updated?: "1";
};

const validateSearch = (
	search: Record<string, unknown>
): WorkspaceApplicationsListSearch => ({
	created: search["created"] === "1" ? "1" : undefined,
	deleted: search["deleted"] === "1" ? "1" : undefined,
	updated: search["updated"] === "1" ? "1" : undefined,
});

export const Route = createFileRoute("/workspaces/$workspaceUuid/applications")(
	{
		beforeLoad: async ({ params }) => {
			await requireApplicationInformationRead(
				`/workspaces/${params.workspaceUuid}/applications`,
				params.workspaceUuid
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
