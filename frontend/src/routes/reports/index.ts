import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const ReportsPage = lazy(async () => ({
	default: (await import("@/features/reports/pages/ReportsPage")).ReportsPage,
}));

export const Route = createFileRoute("/reports/")({
	component: ReportsPage,
});
