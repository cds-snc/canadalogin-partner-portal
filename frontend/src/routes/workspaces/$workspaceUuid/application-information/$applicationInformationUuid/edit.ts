import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireCapability } from "../../../../../features/auth/auth-routing";

const ApplicationInformationEditPage = lazy(async () => ({
	default: (
		await import("../../../../../features/workspaces/pages/ApplicationInformationEditPage")
	).ApplicationInformationEditPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/application-information/$applicationInformationUuid/edit"
)({
	beforeLoad: async ({ params }) => {
		await requireCapability(
			`/workspaces/${params.workspaceUuid}/application-information/${params.applicationInformationUuid}/edit`,
			"application_information_write",
			params.workspaceUuid
		);

		return {
			backLink: {
				href: `/workspaces/${params.workspaceUuid}/application-information/${params.applicationInformationUuid}`,
				label: i18n.t("workspaces.appInfoSectionTitle"),
			},
		} satisfies RouteBackLinkContext;
	},
	component: ApplicationInformationEditPage,
});
