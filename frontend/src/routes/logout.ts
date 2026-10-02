import { createFileRoute, useSearch } from "@tanstack/react-router";
import { createElement } from "react";
import { LogoutPage } from "../features/auth/pages/LogoutPage";

type LogoutSearch = {
	reason?: "session-expired";
};

const validateSearch = (search: Record<string, unknown>): LogoutSearch => ({
	reason: search["reason"] === "session-expired" ? "session-expired" : undefined,
});

const LogoutRouteComponent = (): ReturnType<typeof LogoutPage> => {
	const { reason } = useSearch({ from: "/logout" });
	return createElement(LogoutPage, { reason });
};

export const Route = createFileRoute("/logout")({
	component: LogoutRouteComponent,
	validateSearch,
});
