import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireCapability } from "../features/auth/auth-routing";

export const Route = createFileRoute("/policies")({
	beforeLoad: async () => {
		await requireCapability("/policies", "platform_governance");
		throw redirect({ replace: true, to: "/roles" }) as unknown as Error;
	},
});
