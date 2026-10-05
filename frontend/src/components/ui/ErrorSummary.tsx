import React from "react";
import { GcdsErrorSummary } from "@gcds-core/components-react";

interface ErrorSummaryProps {
	className?: string;
	errorLinks?: Record<string, string>;
	listen?: boolean;
}

const ErrorSummary: React.FC<ErrorSummaryProps> = React.memo(
	({ className, errorLinks, listen }) => (
		<GcdsErrorSummary
			className={className}
			errorLinks={errorLinks}
			listen={listen}
		/>
	)
);

export default ErrorSummary;
