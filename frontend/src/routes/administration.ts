import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "@/features/auth/auth-routing";

const AdministrationPage = lazy(async () => ({
	default: (await import("@/features/administration/pages/AdministrationPage"))
		.AdministrationPage,
}));

export const Route = createFileRoute("/administration")({
	beforeLoad: async () =>
		requireCapability("/administration", "platform_governance"),
	component: AdministrationPage,
});
