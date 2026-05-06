import React from "react";
import { GcdsIcon } from "@gcds-core/components-react";
import type { SpacingValues } from "../../utils/constants";

interface IconProps {
	name:
		| "checkmark-circle"
		| "chevron-down"
		| "chevron-left"
		| "chevron-right"
		| "chevron-up"
		| "close"
		| "download"
		| "email"
		| "exclamation-circle"
		| "external"
		| "info-circle"
		| "phone"
		| "search"
		| "warning-triangle";
	label?: string;
	marginLeft?: SpacingValues;
	marginRight?: SpacingValues;
	size?:
		| "inherit"
		| "text-small"
		| "text"
		| "h6"
		| "h5"
		| "h4"
		| "h3"
		| "h2"
		| "h1";
}

const Icon: React.FC<IconProps> = React.memo(
	({ name, label, marginLeft, marginRight, size = "inherit" }) => {
		return (
			<GcdsIcon
				label={label}
				marginLeft={marginLeft}
				marginRight={marginRight}
				name={name}
				size={size}
			/>
		);
	}
);

export default Icon;
