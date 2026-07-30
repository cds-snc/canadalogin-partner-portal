import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireAuthenticatedUser } from "../../../features/auth/auth-routing";

const WorkspaceSettingsPage = lazy(async () => ({
	default: (await import("../../../features/workspaces/pages/WorkspaceSettingsPage"))
		.WorkspaceSettingsPage,
}));

export const Route = createFileRoute("/workspaces/$workspaceUuid/settings")({
	beforeLoad: async ({ params }) => {
		await requireAuthenticatedUser(
			`/workspaces/${params.workspaceUuid}/settings`
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