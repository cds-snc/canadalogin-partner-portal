import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireSuperuser } from "../features/auth/auth-routing";

const UsersPage = lazy(async () => ({
	default: (await import("../features/users/pages/UsersPage")).UsersPage,
}));

export const Route = createFileRoute("/users")({
	beforeLoad: async () => requireSuperuser("/users"),
	component: UsersPage,
});
