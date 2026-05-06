import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import React from "react";
import { requireAuthenticatedUser } from "../../../../../../features/auth/auth-routing";
import { ApplicationContactPage } from "../../../../../../features/workspaces/pages/ApplicationContactPage";

const contactEditRouteApi = getRouteApi(
	"/workspaces/$workspaceUuid/application-info/$applicationInfoUuid/contacts/$applicationContactUuid"
);

function ContactEditRoute(): React.ReactElement {
	const { applicationContactUuid, applicationInfoUuid, workspaceUuid } =
		contactEditRouteApi.useParams();

	return React.createElement(ApplicationContactPage, {
		applicationContactUuid,
		applicationInfoUuid,
		mode: "edit",
		workspaceUuid,
	});
}

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/application-info/$applicationInfoUuid/contacts/$applicationContactUuid"
)({
	beforeLoad: async ({ params }) =>
		requireAuthenticatedUser(
			`/workspaces/${params.workspaceUuid}/application-info/${params.applicationInfoUuid}/contacts/${params.applicationContactUuid}`
		),
	component: ContactEditRoute,
});