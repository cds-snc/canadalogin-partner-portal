import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const WorkspaceRPRegistrationConfirmationPage = lazy(async () => ({
	default: (
		await import("../../../../../../features/workspaces/pages/WorkspaceRPRegistrationConfirmationPage")
	).WorkspaceRPRegistrationConfirmationPage,
}));

export const Route = createFileRoute(
	"/workspaces/$workspaceUuid/applications/$rpApplicationUuid/registration/confirmation"
)({ component: WorkspaceRPRegistrationConfirmationPage });
