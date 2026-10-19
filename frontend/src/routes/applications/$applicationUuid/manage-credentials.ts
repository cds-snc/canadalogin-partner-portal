import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import { getCurrentUserApplicationByUuid } from "@/fetch/applications";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireAuthenticatedUser } from "../../../features/auth/auth-routing";

const RPApplicationClientSecretsPage = lazy(async () => ({
	default: (
		await import("../../../features/your-applications/pages/ManageCredentialsPage")
	).ManageCredentialsPage,
}));

export const Route = createFileRoute(
	"/applications/$applicationUuid/manage-credentials"
)({
	beforeLoad: async ({ params }) => {
		await requireAuthenticatedUser(
			`/applications/${params.applicationUuid}/manage-credentials`
		);

		const application = await getCurrentUserApplicationByUuid(
			params.applicationUuid
		).catch(() => null);
		const appName =
			application && i18n.resolvedLanguage === "fr" && application.nameFr
				? application.nameFr
				: (application?.nameEn ?? i18n.t("nav.applications"));
		const appHref = `/applications/${params.applicationUuid}`;

		return {
			backLink: { href: appHref, label: appName },
		} satisfies RouteBackLinkContext;
	},
	component: RPApplicationClientSecretsPage,
});