import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const RPRegistrationAdoptionListPage = lazy(async () => ({
	default: (
		await import("../../../features/workspaces/pages/RPRegistrationAdoptionListPage")
	).RPRegistrationAdoptionListPage,
}));

export const Route = createFileRoute("/workspaces/rp-registration-adoption/")({
	component: RPRegistrationAdoptionListPage,
});
