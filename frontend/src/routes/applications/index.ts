import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const ApplicationsPage = lazy(async () => ({
	default: (await import("../../features/applications/pages/ApplicationsPage"))
		.ApplicationsPage,
}));

export const Route = createFileRoute("/applications/")({
	component: ApplicationsPage,
});