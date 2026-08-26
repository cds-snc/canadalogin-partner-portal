import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";

const ApplicationInformationChecklistPage = lazy(async () => ({
	default: (
		await import("../../../../../features/workspaces/pages/ApplicationInformationChecklistPage")
	).ApplicationInformationChecklistPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/checklist-and-evidence"
)({
	beforeLoad: ({ params }) =>
		({
			backLink: {
				href: `/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}`,
				label: i18n.t("workspaces.appInfoBackToApplication"),
			},
		}) satisfies RouteBackLinkContext,
	component: ApplicationInformationChecklistPage,
});
