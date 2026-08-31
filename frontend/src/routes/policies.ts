import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireSuperuser } from "../features/auth/auth-routing";

const PoliciesPage = lazy(async () => ({
	default: (await import("../features/policies/pages/PoliciesPage"))
		.PoliciesPage,
}));

export const Route = createFileRoute("/policies")({
	beforeLoad: async () => {
		await requireSuperuser("/policies");

		return {
			backLink: { href: "/", label: i18n.t("nav.home") },
		} satisfies RouteBackLinkContext;
	},
	component: PoliciesPage,
});
