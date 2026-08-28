import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireCapability } from "../../../../../features/auth/auth-routing";

const ApplicationInformationDeletePage = lazy(async () => ({
	default: (
		await import("../../../../../features/workspaces/pages/ApplicationInformationDeletePage")
	).ApplicationInformationDeletePage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/delete"
)({
	beforeLoad: async ({ params }) => {
		await requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/delete`,
			"application_information_write",
			params.workspaceUuid
		);

		return {
			backLink: {
				href: `/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}`,
				label: i18n.t("workspaces.appInfoBackToApplication"),
			},
		} satisfies RouteBackLinkContext;
	},
	component: ApplicationInformationDeletePage,
});
