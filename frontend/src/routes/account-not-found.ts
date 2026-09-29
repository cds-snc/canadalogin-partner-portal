import { createFileRoute } from "@tanstack/react-router";
import { AccountNotFoundPage } from "../features/auth/pages/AccountNotFoundPage";

export const Route = createFileRoute("/account-not-found")({
	component: AccountNotFoundPage,
});