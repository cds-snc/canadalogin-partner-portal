import { createFileRoute } from "@tanstack/react-router";
import { HealthPage } from "../features/system/pages/HealthPage";

export const Route = createFileRoute("/health")({
	component: HealthPage,
});
