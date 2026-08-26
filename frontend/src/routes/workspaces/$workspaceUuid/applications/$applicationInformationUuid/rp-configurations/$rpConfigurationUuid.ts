import { Outlet, createFileRoute } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireAnyCapability } from "../../../../../../features/auth/auth-routing";

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid"
)({
	beforeLoad: async ({ params }) => {
		await requireAnyCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/rp-configurations/${params.rpConfigurationUuid}`,
			["rp_configuration_read", "cross_workspace_metadata_read"],
			params.workspaceUuid
		);

		return {
			backLink: {
				href: `/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/rp-configurations`,
				label: i18n.t("workspaces.rpConfigurationsBackToList"),
			},
		} satisfies RouteBackLinkContext;
	},
	component: Outlet,
});
