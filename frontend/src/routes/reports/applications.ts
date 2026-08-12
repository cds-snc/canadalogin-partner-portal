import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "@/features/auth/auth-routing";

const ApplicationReportsChooserPage = lazy(async () => ({
	default: (
		await import("@/features/reports/pages/ApplicationReportsChooserPage")
	).ApplicationReportsChooserPage,
}));

export const Route = createFileRoute("/reports/applications")({
	beforeLoad: async () =>
		requireCapability("/reports/applications", "mau_report_read"),
	component: ApplicationReportsChooserPage,
});
