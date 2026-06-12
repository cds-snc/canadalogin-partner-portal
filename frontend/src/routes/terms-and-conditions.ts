import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireAuthenticatedUser } from "../features/auth/auth-routing";

const TermsAndConditionsPage = lazy(
	() => import("../features/auth/pages/TermsAndConditionsPage")
);

const validateSearch = (
	search: Record<string, unknown>
): { redirect?: string } => ({
	redirect:
		typeof search["redirect"] === "string" ? search["redirect"] : undefined,
});

export const Route = createFileRoute("/terms-and-conditions")({
	beforeLoad: async () => requireAuthenticatedUser("/terms-and-conditions"),
	component: TermsAndConditionsPage,
	validateSearch,
});
