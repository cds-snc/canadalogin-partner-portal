import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "../../../../../features/auth/auth-routing";

const ManageCredentialsPage = lazy(async () => ({
	default: (
		await import(
			"../../../../../features/your-applications/pages/ManageCredentialsPage"
		)
	).ManageCredentialsPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$rpApplicationUuid/manage-credentials"
)({
	beforeLoad: async ({ params }) => {
		await requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.rpApplicationUuid}/manage-credentials`,
			"partner_secret_read",
			params.workspaceUuid
		);
		return requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.rpApplicationUuid}/manage-credentials`,
			"partner_secret_lifecycle",
			params.workspaceUuid
		);
	},
	component: ManageCredentialsPage,
});
