import React from "react";
import { GcdsLink } from "@gcds-core/components-react";

interface LinkProps {
	ariaLabel?: string;
	ariaCurrent?: React.AriaAttributes["aria-current"];
	children: React.ReactNode;
	className?: string;
	display?: "block" | "inline";
	external?: boolean;
	href: string;
	onGcdsClick?: (event: Event) => void;
	size?: "inherit" | "regular" | "small";
}

const Link: React.FC<LinkProps> = React.memo(
	({
		ariaLabel,
		ariaCurrent,
		children,
		className,
		display,
		external,
		href,
		onGcdsClick,
		size,
	}) => (
		<GcdsLink
			aria-current={ariaCurrent}
			aria-label={ariaLabel}
			className={className}
			display={display}
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
