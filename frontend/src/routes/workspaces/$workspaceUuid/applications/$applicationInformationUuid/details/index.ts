import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const ApplicationInformationDetailsPage = lazy(async () => ({
	default: (
		await import("../../../../../../features/workspaces/pages/ApplicationInformationDetailsPage")
	).ApplicationInformationDetailsPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/details/"
)({
	component: ApplicationInformationDetailsPage,
});
