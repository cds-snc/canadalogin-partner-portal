import { createFileRoute } from "@tanstack/react-router";
import { AccessDeniedPage } from "../features/auth/pages/AccessDeniedPage";

export const Route = createFileRoute("/access-denied")({
	component: AccessDeniedPage,
});