import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBreadcrumbContext } from "@/types/route-breadcrumbs";
import { requireAuthenticatedUser } from "../../../../features/auth/auth-routing";

const RPApplicationClientSecretsPage = lazy(async () => ({
	default: (
		await import("../../../../features/rp-applications/pages/RPApplicationClientSecretsPage")
	).RPApplicationClientSecretsPage,
}));

export const Route = createFileRoute(
	"/rp-applications/mine/$rpApplicationUuid/client-secrets"
)({
	beforeLoad: async ({ params }) => {
		await requireAuthenticatedUser(
			`/rp-applications/mine/${params.rpApplicationUuid}/client-secrets`
		);

		return {
			breadcrumbs: [
				{ href: "/", label: i18n.t("nav.home") },
				{ href: "/dashboard", label: i18n.t("nav.dashboard") },
				{
					href: `/rp-applications/mine/${params.rpApplicationUuid}/client-secrets`,
					label: i18n.t("workspaces.clientCredentials"),
				},
			],
		} satisfies RouteBreadcrumbContext;
	},
	component: RPApplicationClientSecretsPage,
});
