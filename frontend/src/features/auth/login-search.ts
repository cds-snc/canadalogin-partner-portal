export type LoginRedirectReason = "expired" | "unauthorized";

export type LoginMessageKey = "session-expired";

export type LoginRedirectSearch = {
	message?: LoginMessageKey;
	reason?: LoginRedirectReason;
	redirect?: string;
	uiLocales?: string;
};

const defaultPostLoginPath = "/your-applications";

export const sanitizeAppPath = (
	path: string | null | undefined,
	fallback = defaultPostLoginPath
): string => {
	if (!path) {
		return fallback;
	}

	return path.startsWith("/") ? path : fallback;
};

export const parseLoginReason = (
	value: unknown
): LoginRedirectReason | undefined => {
	if (value === "expired" || value === "unauthorized") {
		return value;
	}

	return undefined;
};

export const parseLoginMessage = (
	value: unknown
): LoginMessageKey | undefined => {
	if (value === "session-expired") {
		return value;
	}

	return undefined;
};

export const buildLoginLocation = (
	search: LoginRedirectSearch
): { search: LoginRedirectSearch; to: "/login" } => ({
	search: {
		message: parseLoginMessage(search.message),
		reason: parseLoginReason(search.reason),
		redirect: sanitizeAppPath(search.redirect, defaultPostLoginPath),
	},
	to: "/login" as const,
});

export const toLoginHref = (search: LoginRedirectSearch): string => {
	const location = buildLoginLocation(search);
	const searchParameters = new URLSearchParams();

	if (location.search.reason) {
		searchParameters.set("reason", location.search.reason);
	}

	if (location.search.message) {
		searchParameters.set("message", location.search.message);
	}

	if (location.search.redirect) {
		searchParameters.set("redirect", location.search.redirect);
	}

	const query = searchParameters.toString();

	return query.length > 0 ? `${location.to}?${query}` : location.to;
};
