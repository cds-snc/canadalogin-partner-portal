import React from "react";
import { GcdsButton } from "@gcds-core/components-react";

interface ButtonProps {
	children: React.ReactNode;
	className?: string;
	disabled?: boolean;
	type: "submit" | "button" | "link" | "reset";
	buttonId?: string;
	buttonRole?: "primary" | "secondary" | "danger" | "start";
	size?: "regular" | "small";
	onGcdsClick?: (e: Event) => void;
	href?: string;
}

const Button: React.FC<ButtonProps> = React.memo(
	({
		children,
		className,
		disabled,
		type,
		buttonId,
		buttonRole = "primary",
		size = "regular",
		onGcdsClick,
		href,
	}): React.ReactElement => (
		<GcdsButton
			buttonId={buttonId}
			buttonRole={buttonRole}
			className={className}
			disabled={disabled}
			href={href}
			size={size}
			type={type}
			onGcdsClick={onGcdsClick}
		>
			{children}
		</GcdsButton>
	)
);

export default Button;
