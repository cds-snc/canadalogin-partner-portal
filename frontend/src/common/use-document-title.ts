import { useEffect } from "react";

/** Keep a localized, route-specific browser title while a page is mounted. */
export const useDocumentTitle = (
	pageTitle: string,
	applicationTitle: string
): void => {
	useEffect((): (() => void) => {
		document.title =
			pageTitle === applicationTitle
				? applicationTitle
				: `${pageTitle} — ${applicationTitle}`;

		return () => {
			document.title = applicationTitle;
		};
	}, [applicationTitle, pageTitle]);
};
