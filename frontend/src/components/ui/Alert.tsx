import React, { type ReactNode } from "react";
import { GcdsAlert } from "@gcds-core/components-react";

interface AlertProps {
	alertRole: "danger" | "info" | "success" | "warning";
	children?: ReactNode;
	container?: "full" | "xl" | "lg" | "md" | "sm" | "xs";
	heading: string;
	onDismiss?: () => void;
}

const Alert: React.FC<AlertProps> = React.memo(
	({ alertRole, children, container, heading, onDismiss }) => (
		<GcdsAlert
			alertRole={alertRole}
			container={container}
			heading={heading}
			onGcdsDismiss={onDismiss}
		>
			{children}
		</GcdsAlert>
	)
);

export default Alert;