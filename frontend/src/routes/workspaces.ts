import { createFileRoute, Outlet } from "@tanstack/react-router";
import React from "react";
import { requireAuthenticatedUser } from "../features/auth/auth-routing";

export const Route = createFileRoute("/workspaces")({
	beforeLoad: async () => requireAuthenticatedUser("/workspaces"),
	component: () => React.createElement(Outlet),
});
