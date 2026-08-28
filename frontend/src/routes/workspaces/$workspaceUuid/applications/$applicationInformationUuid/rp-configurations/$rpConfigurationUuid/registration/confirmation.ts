import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const WorkspaceRPRegistrationConfirmationPage = lazy(async () => ({
	default: (
		await import("../../../../../../../../features/workspaces/pages/WorkspaceRPRegistrationConfirmationPage")
	).WorkspaceRPRegistrationConfirmationPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/registration/confirmation"
)({ component: WorkspaceRPRegistrationConfirmationPage });
