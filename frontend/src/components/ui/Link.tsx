import React from "react";
import { GcdsLink } from "@gcds-core/components-react";

interface LinkProps {
	children: React.ReactNode;
	className?: string;
	external?: boolean;
	href: string;
	onGcdsClick?: (event: Event) => void;
}

const Link: React.FC<LinkProps> = React.memo(
	({ children, className, external, href, onGcdsClick }) => (
		<GcdsLink
			className={className}
			external={external}
			href={href}
			onClickCapture={(event) => onGcdsClick?.(event.nativeEvent)}
		>
			{children}
		</GcdsLink>
	)
);

export default Link;
