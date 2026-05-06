import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireSuperuser } from "../features/auth/auth-routing";

const PoliciesPage = lazy(async () => ({
	default: (await import("../features/policies/pages/PoliciesPage"))
		.PoliciesPage,
}));

export const Route = createFileRoute("/policies")({
	beforeLoad: async () => requireSuperuser("/policies"),
	component: PoliciesPage,
});
