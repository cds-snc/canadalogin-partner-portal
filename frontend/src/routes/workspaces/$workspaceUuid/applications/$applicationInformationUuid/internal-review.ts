import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireCapability } from "../../../../../features/auth/auth-routing";

const ApplicationInformationInternalReviewPage = lazy(async () => ({
	default: (
		await import("../../../../../features/workspaces/pages/ApplicationInformationInternalReviewPage")
	).ApplicationInformationInternalReviewPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/internal-review"
)({
	beforeLoad: async ({ params }) => {
		await requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/internal-review`,
			"production_review"
		);

		return {
			backLink: {
				href: `/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}`,
				label: i18n.t("workspaces.appInfoBackToApplication"),
			},
		} satisfies RouteBackLinkContext;
	},
	component: ApplicationInformationInternalReviewPage,
});
