import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "../../../../../../../features/auth/auth-routing";

const ManageCredentialsPage = lazy(async () => ({
	default: (
		await import("../../../../../../../features/your-applications/pages/ManageCredentialsPage")
	).ManageCredentialsPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/manage-credentials"
)({
	beforeLoad: async ({ params }) =>
		requireCapability(
			`/workspaces/${params.workspaceUuid}/applications/${params.applicationInformationUuid}/rp-configurations/${params.rpConfigurationUuid}/manage-credentials`,
			"partner_secret_read",
			params.workspaceUuid
		),
	component: ManageCredentialsPage,
});
