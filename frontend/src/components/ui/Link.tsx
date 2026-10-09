import React from "react";
import { GcdsLink } from "@gcds-core/components-react";

interface LinkProps {
	children: React.ReactNode;
	className?: string;
	external?: boolean;
	href: string;
	onGcdsClick?: (event: Event) => void;
	size?: "inherit" | "regular" | "small";
}

const Link: React.FC<LinkProps> = React.memo(
	({ children, className, external, href, onGcdsClick, size }) => (
		<GcdsLink
			className={className}
			external={external}
			href={href}
			size={size}
			onGcdsClick={onGcdsClick}
		>
			{children}
		</GcdsLink>
	)
);

export default Link;
