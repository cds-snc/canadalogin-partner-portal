import { Outlet, createFileRoute } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireApplicationInformationRead } from "../../../features/auth/auth-routing";

type ApplicationInformationListSearch = {
	deleted?: "1";
};

const validateSearch = (
	search: Record<string, unknown>
): ApplicationInformationListSearch => ({
	deleted: search["deleted"] === "1" ? "1" : undefined,
});

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/application-information"
)({
	beforeLoad: async ({ params }) => {
		await requireApplicationInformationRead(
			`/workspaces/${params.workspaceUuid}/application-information`,
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
});
