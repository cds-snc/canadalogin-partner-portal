import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/your-applications/")({
	beforeLoad: () => {
		throw redirect({ href: "/workspaces", replace: true }) as unknown as Error;
	},
});
