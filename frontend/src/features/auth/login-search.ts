export type LoginRedirectReason = "expired" | "unauthorized";

export type LoginMessageKey = "session-expired";

export type LoginRedirectSearch = {
	message?: LoginMessageKey;
	reason?: LoginRedirectReason;
	redirect?: string;
	uiLocales?: string;
};

const defaultPostLoginPath = "/";

const SAFE_APP_PATH_PREFIXES = [
	"/accept-terms",
	"/administration",
	"/audit-logs",
	"/departments",
	"/invitations/rp-applications",
	"/onboarding-oversight",
	"/profile/setup",
	"/roles",
	"/support",
	"/terms-and-conditions",
	"/tiers",
	"/users",
	"/workspaces",
	"/your-applications",
] as const;

const isSafeAppPathname = (pathname: string): boolean =>
	pathname === "/" ||
	SAFE_APP_PATH_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
	);

const hasControlCharacter = (value: string): boolean =>
	Array.from(value).some((character) => {
		const codePoint = character.codePointAt(0);
		return codePoint !== undefined && (codePoint <= 31 || codePoint === 127);
	});

export const sanitizeAppPath = (
	path: string | null | undefined,
	fallback = defaultPostLoginPath
): string => {
	if (
		!path ||
		!path.startsWith("/") ||
		path.startsWith("//") ||
		path.includes("\\") ||
		hasControlCharacter(path)
	) {
		return fallback;
	}

	let parsed: URL;
	try {
		parsed = new URL(path, "https://partner-portal.invalid");
	} catch {
		return fallback;
	}

	if (
		parsed.origin !== "https://partner-portal.invalid" ||
		!isSafeAppPathname(parsed.pathname)
	) {
		return fallback;
	}

	// Intended-destination state carries only route identity and safe path
	// parameters. Query strings and fragments may contain filters, copied
	// personal information, tokens, or client-authored authority, so they are
	// deliberately dropped and re-established by the destination page.
	return parsed.pathname;
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
): { search: LoginRedirectSearch; to: "/" } => ({
	search: {
		message: parseLoginMessage(search.message),
		reason: parseLoginReason(search.reason),
		redirect: sanitizeAppPath(search.redirect, defaultPostLoginPath),
	},
	to: "/" as const,
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
