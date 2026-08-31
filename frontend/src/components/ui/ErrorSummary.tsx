import React from "react";
import { GcdsErrorSummary } from "@gcds-core/components-react";

interface ErrorSummaryProps {
	className?: string;
	listen?: boolean;
}

const ErrorSummary: React.FC<ErrorSummaryProps> = React.memo(
	({ className, listen }) => (
		<GcdsErrorSummary className={className} listen={listen} />
	)
);

export default ErrorSummary;
