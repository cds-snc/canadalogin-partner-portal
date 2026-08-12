import { Outlet, createFileRoute } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import { requireCapability } from "@/features/auth/auth-routing";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";

export const Route = createFileRoute("/workspaces/rp-registration-adoption")({
	beforeLoad: async () => {
		await requireCapability(
			"/workspaces/rp-registration-adoption",
			"partner_bootstrap"
		);

		return {
			backLink: {
				href: "/workspaces",
				label: i18n.t("nav.workspaces"),
			},
		} satisfies RouteBackLinkContext;
	},
	component: Outlet,
});
