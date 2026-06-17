import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBreadcrumbContext } from "@/types/route-breadcrumbs";
import { requireSuperuser } from "../features/auth/auth-routing";

const RolesPage = lazy(async () => ({
	default: (await import("../features/roles/pages/RolesPage")).RolesPage,
}));

export const Route = createFileRoute("/roles")({
	beforeLoad: async () => {
		await requireSuperuser("/roles");

		return {
			breadcrumbs: [
				{ href: "/", label: i18n.t("nav.home") },
				{ href: "/roles", label: i18n.t("nav.roles") },
			],
		} satisfies RouteBreadcrumbContext;
	},
	component: RolesPage,
});
