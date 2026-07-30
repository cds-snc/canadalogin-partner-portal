import { Outlet, createFileRoute } from "@tanstack/react-router";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireAuthenticatedUser } from "../../features/auth/auth-routing";

type WorkspaceDetailSearch = {
	created?: "1";
	updated?: "1";
};

const validateSearch = (
	search: Record<string, unknown>
): WorkspaceDetailSearch => ({
	created: search["created"] === "1" ? "1" : undefined,
	updated: search["updated"] === "1" ? "1" : undefined,
});

export const Route = createFileRoute("/workspaces/$workspaceUuid")({
	beforeLoad: async ({ params }) => {
		await requireAuthenticatedUser(`/workspaces/${params.workspaceUuid}`);

		return {
			backLink: { href: "/workspaces", label: i18n.t("nav.workspaces") },
		} satisfies RouteBackLinkContext;
	},
	component: Outlet,
	validateSearch,
});