import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { requireCapability } from "../features/auth/auth-routing";

const AuditLogsPage = lazy(async () => ({
	default: (await import("../features/audit-logs/pages/AuditLogsPage"))
		.AuditLogsPage,
}));

export const Route = createFileRoute("/audit-logs")({
	beforeLoad: async () =>
		requireCapability("/audit-logs", "platform_governance"),
	component: AuditLogsPage,
});
