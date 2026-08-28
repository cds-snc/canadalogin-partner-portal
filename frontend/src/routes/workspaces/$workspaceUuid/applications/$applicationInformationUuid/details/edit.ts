import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireCapability } from "../../../../../../features/auth/auth-routing";

const ApplicationInformationDetailsEditPage = lazy(async () => ({
	default: (
		await import("../../../../../../features/workspaces/pages/ApplicationInformationDetailsEditPage")
	).ApplicationInformationDetailsEditPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/details/edit"
)({
	beforeLoad: async ({ params }) => {
		await requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/details/edit`,
			"application_information_write",
			params.workspaceUuid
		);

		return {
			backLink: {
				href: `/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/details`,
				label: i18n.t("workspaces.appInfoHubDetailsTitle"),
			},
		} satisfies RouteBackLinkContext;
	},
	component: ApplicationInformationDetailsEditPage,
});
