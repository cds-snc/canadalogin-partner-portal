import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const YourApplicationsPage = lazy(async () => ({
	default: (
		await import("../../features/your-applications/pages/YourApplicationsPage")
	).YourApplicationsPage,
}));

export const Route = createFileRoute("/your-applications/")({
	component: YourApplicationsPage,
});
