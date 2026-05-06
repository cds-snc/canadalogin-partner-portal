import { createFileRoute, useParams } from "@tanstack/react-router";
import React from "react";
import { requireAuthenticatedUser } from "../../../../../../features/auth/auth-routing";
import { ApplicationContactPage } from "../../../../../../features/workspaces/pages/ApplicationContactPage";

function ContactCreateRoute(): React.ReactElement {
	const { applicationInfoUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/application-info/$applicationInfoUuid/contacts/new",
	});
	return React.createElement(ApplicationContactPage, {
		applicationInfoUuid,
		mode: "create",
		workspaceUuid,
	});
}

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/application-info/$applicationInfoUuid/contacts/new"
)({
	beforeLoad: async ({ params }) =>
		requireAuthenticatedUser(
			`/workspaces/${params.workspaceUuid}/application-info/${params.applicationInfoUuid}/contacts/new`
		),
	component: ContactCreateRoute,
});