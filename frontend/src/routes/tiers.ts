import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireSuperuser } from "../features/auth/auth-routing";

const TiersPage = lazy(async () => ({
	default: (await import("../features/tiers/pages/TiersPage")).TiersPage,
}));

export const Route = createFileRoute("/tiers")({
	beforeLoad: async () => {
		await requireSuperuser("/tiers");

		return {
			backLink: { href: "/", label: i18n.t("nav.home") },
		} satisfies RouteBackLinkContext;
	},
	component: TiersPage,
});
