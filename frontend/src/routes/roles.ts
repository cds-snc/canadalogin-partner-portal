import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireSuperuser } from "../features/auth/auth-routing";

const RolesPage = lazy(async () => ({
	default: (await import("../features/roles/pages/RolesPage")).RolesPage,
}));

export const Route = createFileRoute("/roles")({
	beforeLoad: async () => {
		await requireSuperuser("/roles");

		return {
			backLink: { href: "/", label: i18n.t("nav.home") },
		} satisfies RouteBackLinkContext;
	},
	component: RolesPage,
});
