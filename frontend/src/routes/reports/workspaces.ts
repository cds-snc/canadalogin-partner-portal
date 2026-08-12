import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "@/features/auth/auth-routing";

const WorkspaceReportsChooserPage = lazy(async () => ({
	default: (
		await import("@/features/reports/pages/WorkspaceReportsChooserPage")
	).WorkspaceReportsChooserPage,
}));

export const Route = createFileRoute("/reports/workspaces")({
	beforeLoad: async () =>
		requireCapability("/reports/workspaces", "aggregate_report_read"),
	component: WorkspaceReportsChooserPage,
});
