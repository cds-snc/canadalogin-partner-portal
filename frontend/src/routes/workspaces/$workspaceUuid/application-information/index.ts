import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const ApplicationInformationListPage = lazy(async () => ({
	default: (
		await import(
			"../../../../features/workspaces/pages/ApplicationInformationListPage"
		)
	).ApplicationInformationListPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/application-information/"
)({
	component: ApplicationInformationListPage,
});