import { createFileRoute, Outlet } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireCapability } from "../../../features/auth/auth-routing";

export const Route = createFileRoute("/workspaces/$workspaceUuid/access")({
	beforeLoad: async ({ params }) => {
		await requireCapability(
			`/workspaces/${params.workspaceUuid}/access`,
			"partner_staff_assignment",
			params.workspaceUuid
		);
		return {
			backLink: {
				href: `/workspaces/${params.workspaceUuid}`,
				label: i18n.t("workspaces.workspaceLabel"),
			},
		} satisfies RouteBackLinkContext;
	},
	component: Outlet,
});
