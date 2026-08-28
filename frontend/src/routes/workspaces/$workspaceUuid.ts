import { Outlet, createFileRoute } from "@tanstack/react-router";
import { createElement } from "react";
import i18n from "@/common/i18n";
import type { FunctionComponent } from "@/common/types";
import { WorkspaceSectionLayout } from "@/features/workspaces/components/WorkspaceSectionLayout";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireWorkspaceRead } from "../../features/auth/auth-routing";

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

const WorkspaceRouteLayout = (): FunctionComponent =>
	createElement(WorkspaceSectionLayout, undefined, createElement(Outlet));

export const Route = createFileRoute("/workspaces/$workspaceUuid")({
	beforeLoad: async ({ params }) => {
		await requireWorkspaceRead(
			`/workspaces/${params.workspaceUuid}`,
			params.workspaceUuid
		);

		return {
			backLink: { href: "/workspaces", label: i18n.t("nav.workspaces") },
		} satisfies RouteBackLinkContext;
	},
	component: WorkspaceRouteLayout,
	validateSearch,
});
