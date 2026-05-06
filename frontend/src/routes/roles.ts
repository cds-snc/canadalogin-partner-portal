import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireSuperuser } from "../features/auth/auth-routing";

const RolesPage = lazy(async () => ({
	default: (await import("../features/roles/pages/RolesPage")).RolesPage,
}));

export const Route = createFileRoute("/roles")({
	beforeLoad: async () => requireSuperuser("/roles"),
	component: RolesPage,
});
