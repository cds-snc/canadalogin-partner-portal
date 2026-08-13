import React from "react";
import { GcdsErrorSummary } from "@gcds-core/components-react";

interface ErrorSummaryProps {
	className?: string;
	errorLinks?: Record<string, string>;
	focusOnRender?: boolean;
	heading?: string;
	listen?: boolean;
}

const ErrorSummary: React.FC<ErrorSummaryProps> = React.memo(
	({ className, errorLinks, focusOnRender = false, heading, listen }) => {
		const summaryRef = React.useRef<HTMLGcdsErrorSummaryElement>(null);
		const hasFocusedRef = React.useRef(false);
		const errorLinksKey = JSON.stringify(errorLinks ?? {});
		const hasErrors = Boolean(errorLinks && Object.keys(errorLinks).length > 0);

		React.useLayoutEffect(() => {
			const summary = summaryRef.current;
			if (!summary) return;
			if (errorLinks !== undefined) summary.errorLinks = errorLinks;
			summary.listen = listen ?? errorLinks === undefined;
		}, [errorLinks, errorLinksKey, listen]);

		React.useEffect(() => {
			if (!hasErrors) {
				hasFocusedRef.current = false;
				return;
			}
			if (!focusOnRender || hasFocusedRef.current) {
				return;
			}
			let cancelled = false;
			const focusSummary = (): void => {
				if (cancelled || hasFocusedRef.current) return;
				const summary = summaryRef.current;
				if (!summary) return;
				const focusTarget =
					summary.shadowRoot?.querySelector<HTMLElement>("div") ?? summary;
				if (focusTarget === summary) summary.tabIndex = -1;
				hasFocusedRef.current = true;
				focusTarget.focus();
			};
			const summary = summaryRef.current;
			const ready = summary?.componentOnReady?.();
			const timer = window.setTimeout(() => {
				if (ready) {
					void ready.then(focusSummary);
				} else {
					focusSummary();
				}
			}, 0);
			return (): void => {
				cancelled = true;
				window.clearTimeout(timer);
			};
		}, [focusOnRender, hasErrors]);

		return (
			<GcdsErrorSummary
				ref={summaryRef}
				className={className}
				errorLinks={errorLinks}
				heading={heading}
				listen={listen}
			/>
		);
	}
);

export default ErrorSummary;
