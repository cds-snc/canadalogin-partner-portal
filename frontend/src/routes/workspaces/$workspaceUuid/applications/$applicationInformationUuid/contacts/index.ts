import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const ApplicationInformationContactsPage = lazy(async () => ({
	default: (
		await import("../../../../../../features/workspaces/pages/ApplicationInformationContactsPage")
	).ApplicationInformationContactsPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/contacts/"
)({
	component: ApplicationInformationContactsPage,
});
