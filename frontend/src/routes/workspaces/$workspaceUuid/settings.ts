import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireCapability } from "../../../features/auth/auth-routing";

const WorkspaceSettingsPage = lazy(async () => ({
	default: (
		await import("../../../features/workspaces/pages/WorkspaceSettingsPage")
	).WorkspaceSettingsPage,
}));

export const Route = createFileRoute("/workspaces/$workspaceUuid/settings")({
	beforeLoad: async ({ params }) => {
		await requireCapability(
			`/workspaces/${params.workspaceUuid}/settings`,
			"workspace_metadata_write",
			params.workspaceUuid
		);

		return {
			backLink: {
				href: `/workspaces/${params.workspaceUuid}`,
				label: i18n.t("nav.workspaces"),
			},
		} satisfies RouteBackLinkContext;
	},
	component: WorkspaceSettingsPage,
});
