const STATIC_PAGE_LAST_UPDATED: Readonly<Record<string, string>> = {
	"/support": "2026-08-12",
	"/terms-and-conditions": "2026-08-12",
};

export const getPageLastUpdated = (pathname: string): string | null =>
	STATIC_PAGE_LAST_UPDATED[pathname] ?? null;
