import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/invitations/rp-applications")({
	component: Outlet,
});
