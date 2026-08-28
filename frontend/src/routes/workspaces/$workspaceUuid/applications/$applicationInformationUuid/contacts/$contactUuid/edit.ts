import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireCapability } from "../../../../../../../features/auth/auth-routing";

const ApplicationInformationContactEditPage = lazy(async () => ({
	default: (
		await import("../../../../../../../features/workspaces/pages/ApplicationInformationContactEditPage")
	).ApplicationInformationContactEditPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/contacts/$contactUuid/edit"
)({
	beforeLoad: async ({ params }) => {
		await requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/contacts/${params.contactUuid}/edit`,
			"application_information_write",
			params.workspaceUuid
		);

		return {
			backLink: {
				href: `/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/contacts`,
				label: i18n.t("workspaces.appInfoContacts"),
			},
		} satisfies RouteBackLinkContext;
	},
	component: ApplicationInformationContactEditPage,
});
