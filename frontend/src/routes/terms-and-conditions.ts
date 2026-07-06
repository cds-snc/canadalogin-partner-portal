import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const TermsAndConditionsPage = lazy(
	() => import("../features/auth/pages/TermsAndConditionsPage")
);

export const Route = createFileRoute("/terms-and-conditions")({
	component: TermsAndConditionsPage,
});
