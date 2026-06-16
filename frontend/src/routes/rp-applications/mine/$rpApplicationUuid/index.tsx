import { createFileRoute } from "@tanstack/react-router";
import { CurrentUserRPOAuthSetupPage } from "../../../../features/rp-applications/pages/CurrentUserRPOAuthSetupPage";

export const Route = createFileRoute(
	"/rp-applications/mine/$rpApplicationUuid/"
)({
	component: CurrentUserRPOAuthSetupPage,
});
