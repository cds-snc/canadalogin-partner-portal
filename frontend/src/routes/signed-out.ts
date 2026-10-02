import { createFileRoute, useSearch } from "@tanstack/react-router";
import { createElement } from "react";
import { SignedOutPage } from "../features/auth/pages/SignedOutPage";

type SignedOutSearch = {
	state?: string;
};

const isSessionExpiredState = (state: unknown): state is string =>
	typeof state === "string" &&
	/^session-expired\.[A-Za-z0-9_-]{8,}$/.test(state);

const validateSearch = (search: Record<string, unknown>): SignedOutSearch => ({
	state: isSessionExpiredState(search["state"]) ? search["state"] : undefined,
});

const SignedOutRouteComponent = (): ReturnType<typeof SignedOutPage> => {
	const { state } = useSearch({ from: "/signed-out" });
	return createElement(SignedOutPage, {
		reason: isSessionExpiredState(state) ? "session-expired" : undefined,
	});
};

export const Route = createFileRoute("/signed-out")({
	component: SignedOutRouteComponent,
	validateSearch,
});