import React from "react";
import { GcdsLink } from "@gcds-core/components-react";

interface LinkProps {
	children: React.ReactNode;
	className?: string;
	external?: boolean;
	href: string;
}

const Link: React.FC<LinkProps> = React.memo(
	({ children, className, external, href }) => (
		<GcdsLink className={className} external={external} href={href}>
			{children}
		</GcdsLink>
	)
);

export default Link;
