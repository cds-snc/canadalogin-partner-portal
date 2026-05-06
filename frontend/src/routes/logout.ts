import { createFileRoute } from "@tanstack/react-router";
import { LogoutPage } from "../features/auth/pages/LogoutPage";

export const Route = createFileRoute("/logout")({
	component: LogoutPage,
});
