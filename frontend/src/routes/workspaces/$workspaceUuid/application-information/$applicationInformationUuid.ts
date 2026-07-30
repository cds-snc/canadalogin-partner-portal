import { Outlet, createFileRoute } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireAuthenticatedUser } from "../../../../features/auth/auth-routing";

type ApplicationInformationDetailSearch = {
	created?: "1";
	updated?: "1";
};

const validateSearch = (
	search: Record<string, unknown>
): ApplicationInformationDetailSearch => ({
	created: search["created"] === "1" ? "1" : undefined,
	updated: search["updated"] === "1" ? "1" : undefined,
});

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/application-information/$applicationInformationUuid"
)({
	beforeLoad: async ({ params }) => {
		await requireAuthenticatedUser(
			`/workspaces/${params.workspaceUuid}/application-information/${params.applicationInformationUuid}`
		);

		return {
			backLink: {
				href: `/workspaces/${params.workspaceUuid}/application-information`,
				label: i18n.t("workspaces.appInfoSectionTitle"),
			},
		} satisfies RouteBackLinkContext;
	},
	component: Outlet,
	validateSearch,
});