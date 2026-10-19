import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import type { FunctionComponent } from "@/common/types";

export const Route = createFileRoute(
	"/applications/$applicationUuid/environments/$environmentUuid/english-url"
)({
	component: lazy(async () => {
		const { EnvironmentUrlPage } =
			await import("../../../../../features/application-environments/pages/EnvironmentUrlPage");
		return {
			default: (): FunctionComponent => <EnvironmentUrlPage language="en" />,
		};
	}),
});
