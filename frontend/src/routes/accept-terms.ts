import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireAuthenticatedUser } from "../features/auth/auth-routing";

const AcceptTermsPage = lazy(
	() => import("../features/auth/pages/AcceptTermsPage")
);

const validateSearch = (
	search: Record<string, unknown>
): { redirect?: string } => ({
	redirect:
		typeof search["redirect"] === "string" ? search["redirect"] : undefined,
});

export const Route = createFileRoute("/accept-terms")({
	beforeLoad: async () => requireAuthenticatedUser("/accept-terms"),
	component: AcceptTermsPage,
	validateSearch,
});
