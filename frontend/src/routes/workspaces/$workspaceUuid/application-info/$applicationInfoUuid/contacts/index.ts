import { createFileRoute } from "@tanstack/react-router";
import { ApplicationContactsManagementPage } from "../../../../../../features/workspaces/pages/ApplicationContactsManagementPage";
import { requireAuthenticatedUser } from "../../../../../../features/auth/auth-routing";

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/application-info/$applicationInfoUuid/contacts/"
)({
	beforeLoad: async ({ params }) =>
		requireAuthenticatedUser(
			`/workspaces/${params.workspaceUuid}/application-info/${params.applicationInfoUuid}/contacts`
		),
	component: ApplicationContactsManagementPage,
});