import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBreadcrumbContext } from "@/types/route-breadcrumbs";
import { requireSuperuser } from "../features/auth/auth-routing";

const PoliciesPage = lazy(async () => ({
	default: (await import("../features/policies/pages/PoliciesPage"))
		.PoliciesPage,
}));

export const Route = createFileRoute("/policies")({
	beforeLoad: async () => {
		await requireSuperuser("/policies");

		return {
			breadcrumbs: [
				{ href: "/", label: i18n.t("nav.home") },
				{ href: "/policies", label: i18n.t("nav.policies") },
			],
		} satisfies RouteBreadcrumbContext;
	},
	component: PoliciesPage,
});
