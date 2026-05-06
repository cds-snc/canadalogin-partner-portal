import React from "react";
import { GcdsContainer } from "@gcds-core/components-react";
import type { SpacingValues } from "../../utils/constants";

interface ContainerProps {
	border?: boolean;
	children: React.ReactNode;
	alignment?: "start" | "center" | "end";
	id: string;
	layout?: "full" | "page";
	margin?: SpacingValues;
	padding?: SpacingValues;
	size?: "full" | "xl" | "lg" | "md" | "sm" | "xs";
	tag?: string;
}

const Container: React.FC<ContainerProps> = React.memo(
	({
		border = false,
		alignment,
		id,
		layout,
		margin,
		padding,
		size = "full",
		tag = "div",
		children,
	}) => (
		<GcdsContainer
			alignment={alignment}
			border={border}
			id={id}
			layout={layout}
			margin={margin}
			padding={padding}
			size={size}
			tag={tag}
		>
			{children}
		</GcdsContainer>
	)
);

export default Container;
