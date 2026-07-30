import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireAuthenticatedUser } from "../../../features/auth/auth-routing";

const WorkspaceMembersPage = lazy(async () => ({
	default: (await import("../../../features/workspaces/pages/WorkspaceMembersPage"))
		.WorkspaceMembersPage,
}));

export const Route = createFileRoute("/workspaces/$workspaceUuid/members")({
	beforeLoad: async ({ params }) => {
		await requireAuthenticatedUser(`/workspaces/${params.workspaceUuid}/members`);

		return {
			backLink: {
				href: `/workspaces/${params.workspaceUuid}`,
				label: i18n.t("workspaces.workspaceLabel"),
			},
		} satisfies RouteBackLinkContext;
	},
	component: WorkspaceMembersPage,
});