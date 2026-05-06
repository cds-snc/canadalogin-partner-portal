import { createFileRoute } from "@tanstack/react-router";
import {
	parseLoginMessage,
	parseLoginReason,
	type LoginRedirectSearch,
} from "../features/auth/login-search";
import { LoginPage } from "../features/auth/pages/LoginPage";

type LoginNotice = {
	bodyKey: "login.expiredBody" | "login.unauthorizedBody";
	titleKey: "login.expiredTitle" | "login.unauthorizedTitle";
};

const validateSearch = (
	search: Record<string, unknown>
): LoginRedirectSearch => ({
	message: parseLoginMessage(search["message"]),
	reason: parseLoginReason(search["reason"]),
	redirect:
		typeof search["redirect"] === "string" ? search["redirect"] : undefined,
});

const getLoginNotice = ({
	message,
	reason,
}: LoginRedirectSearch): LoginNotice | null => {
	if (reason === "unauthorized" || message === "session-expired") {
		return {
			bodyKey: "login.unauthorizedBody",
			titleKey: "login.unauthorizedTitle",
		};
	}

	if (reason === "expired") {
		return {
			bodyKey: "login.expiredBody",
			titleKey: "login.expiredTitle",
		};
	}

	return null;
};

export const Route = createFileRoute("/login")({
	component: LoginPage,
	loader: ({ deps }) => ({
		loginNotice: getLoginNotice(
			(deps as { search: LoginRedirectSearch }).search
		),
	}),
	loaderDeps: ({ search }): { search: LoginRedirectSearch } => ({ search }),
	validateSearch,
});
