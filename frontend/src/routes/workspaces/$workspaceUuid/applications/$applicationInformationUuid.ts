import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import { resolveWorkspaceApplicationResource } from "@/features/rp-applications/legacy-rp-configuration-route";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireApplicationInformationRead } from "../../../../features/auth/auth-routing";

type ApplicationInformationDetailSearch = {
	created?: "1";
	updated?: "1";
};

const validateSearch = (
	search: Record<string, unknown>
): ApplicationInformationDetailSearch => ({
	created: search["created"] === "1" ? "1" : undefined,
	updated: search["updated"] === "1" ? "1" : undefined,
});

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid"
)({
	beforeLoad: async ({ location, params }) => {
		const resourceBase = `/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}`;
		await requireApplicationInformationRead(resourceBase, params.workspaceUuid);
		const resolution = await resolveWorkspaceApplicationResource({
			legacySuffix: location.pathname
				.slice(resourceBase.length)
				.replace(/\/$/, ""),
			resourceUuid: params.applicationInformationUuid,
			workspaceUuid: params.workspaceUuid,
		});
		if (resolution.kind === "legacyRedirect") {
			throw redirect({
				href: resolution.href,
				replace: true,
			}) as unknown as Error;
		}
		if (resolution.kind === "unavailable") {
			throw redirect({
				href: "/error?kind=not_found",
				replace: true,
			}) as unknown as Error;
		}

		return {
			backLink: {
				href: `/workspaces/${params.workspaceUuid}/applications`,
				label: i18n.t("workspaces.appInfoSectionTitle"),
			},
		} satisfies RouteBackLinkContext;
	},
	component: Outlet,
	validateSearch,
});
