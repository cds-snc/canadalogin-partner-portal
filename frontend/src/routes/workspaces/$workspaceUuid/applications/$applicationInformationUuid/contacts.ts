import { Outlet, createFileRoute } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireApplicationInformationRead } from "../../../../../features/auth/auth-routing";

type ApplicationInformationContactsSearch = {
	created?: "1";
	updated?: "1";
};

const validateSearch = (
	search: Record<string, unknown>
): ApplicationInformationContactsSearch => ({
	created: search["created"] === "1" ? "1" : undefined,
	updated: search["updated"] === "1" ? "1" : undefined,
});

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/contacts"
)({
	beforeLoad: async ({ params }) => {
		await requireApplicationInformationRead(
			`/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/contacts`,
			params.workspaceUuid
		);

		return {
			backLink: {
				href: `/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}`,
				label: i18n.t("workspaces.appInfoContactsBackToApplication"),
			},
		} satisfies RouteBackLinkContext;
	},
	component: Outlet,
	validateSearch,
});
