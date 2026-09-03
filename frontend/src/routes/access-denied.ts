import { createFileRoute, useSearch } from "@tanstack/react-router";
import { createElement } from "react";
import { AccessDeniedPage } from "../features/auth/pages/AccessDeniedPage";

type AccessDeniedSearch = {
	reason?: "concurrent-session-limit";
};

const validateSearch = (search: Record<string, unknown>): AccessDeniedSearch => ({
	reason:
		search["reason"] === "concurrent-session-limit"
			? "concurrent-session-limit"
			: undefined,
});

const AccessDeniedRouteComponent = (): ReturnType<typeof AccessDeniedPage> => {
	const { reason } = useSearch({ from: "/access-denied" });
	return createElement(AccessDeniedPage, { reason });
};

export const Route = createFileRoute("/access-denied")({
	component: AccessDeniedRouteComponent,
	validateSearch,
});
