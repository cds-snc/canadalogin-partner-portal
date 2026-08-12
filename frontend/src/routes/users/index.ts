import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const UsersPage = lazy(async () => ({
	default: (await import("../../features/users/pages/UsersPage")).UsersPage,
}));

export const Route = createFileRoute("/users/")({
	component: UsersPage,
});
