import { Outlet, createFileRoute } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireCapability } from "../features/auth/auth-routing";

export const Route = createFileRoute("/users")({
	beforeLoad: async () => {
		await requireCapability("/users", "platform_governance");

		return {
			backLink: {
				href: "/administration",
				label: i18n.t("nav.administration"),
			},
		} satisfies RouteBackLinkContext;
	},
	component: Outlet,
});
