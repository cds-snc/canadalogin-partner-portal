import React from "react";
import { GcdsText } from "@gcds-core/components-react";
import type { SpacingValues } from "../../utils/constants";

interface TextProps {
	children: React.ReactNode;
	marginBottom?: SpacingValues;
	marginTop?: SpacingValues;
	size?: "body" | "small";
	textRole?: "light" | "primary" | "secondary";
	ariaLive?: "off" | "polite" | "assertive";
}

const Text: React.FC<TextProps> = React.memo(
	({
		children,
		marginBottom = "300",
		marginTop = "0",
		size = "body",
		textRole = "primary",
		ariaLive = undefined,
	}) => (
		<GcdsText
			aria-live={ariaLive}
			marginBottom={marginBottom}
			marginTop={marginTop}
			role={ariaLive ? "status" : undefined}
			size={size}
			textRole={textRole}
		>
			{children}
		</GcdsText>
	)
);

export default Text;
