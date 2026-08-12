import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import i18n from "@/common/i18n";
import type { RouteBackLinkContext } from "@/types/route-breadcrumbs";
import { requireCapability } from "../../features/auth/auth-routing";

const WorkspaceCreatePage = lazy(async () => ({
	default: (await import("../../features/workspaces/pages/WorkspaceCreatePage"))
		.WorkspaceCreatePage,
}));

export const Route = createFileRoute("/workspaces/new")({
	beforeLoad: async () => {
		await requireCapability("/workspaces/new", "partner_bootstrap");

		return {
			backLink: { href: "/workspaces", label: i18n.t("nav.workspaces") },
		} satisfies RouteBackLinkContext;
	},
	component: WorkspaceCreatePage,
});
