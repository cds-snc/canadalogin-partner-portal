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
		const errorLinksKey = JSON.stringify(errorLinks ?? {});

		React.useEffect(() => {
			if (
				!focusOnRender ||
				!errorLinks ||
				Object.keys(errorLinks).length === 0
			) {
				return;
			}
			const timer = window.setTimeout(() => {
				summaryRef.current?.focus();
			}, 0);
			return (): void => {
				window.clearTimeout(timer);
			};
		}, [errorLinks, errorLinksKey, focusOnRender]);

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
