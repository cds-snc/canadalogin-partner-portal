import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const ApplicationInformationDetailPage = lazy(async () => ({
	default: (
		await import(
			"../../../../../features/workspaces/pages/ApplicationInformationDetailPage"
		)
	).ApplicationInformationDetailPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/application-information/$applicationInformationUuid/"
)({
	component: ApplicationInformationDetailPage,
});