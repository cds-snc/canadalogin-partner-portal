import { createFileRoute } from "@tanstack/react-router";
import { OAuthSetupPage } from "../../../features/your-applications/pages/OAuthSetupPage";

export const Route = createFileRoute("/applications/$applicationUuid/")({
	component: OAuthSetupPage,
});