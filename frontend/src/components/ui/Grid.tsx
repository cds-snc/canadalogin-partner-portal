import React from "react";
import { GcdsGrid } from "@gcds-core/components-react";

type ContentValues =
	| "center"
	| "end"
	| "space-around"
	| "space-between"
	| "space-evenly"
	| "start"
	| "stretch";

type GridGap =
	| "150"
	| "175"
	| "200"
	| "225"
	| "250"
	| "300"
	| "350"
	| "400"
	| "450"
	| "500"
	| "550"
	| "600"
	| "650"
	| "700"
	| "750"
	| "800";

interface GridProps {
	children?: React.ReactNode;
	alignment?: "start" | "center" | "end";
	alignItems?: "baseline" | "center" | "end" | "start" | "stretch";
	columns?: string;
	columnsDesktop?: string;
	columnsTablet?: string;
	container?: "full" | "xl" | "lg" | "md" | "sm" | "xs";
	className?: string;
	display?: "grid" | "inline-grid";
	equalRowHeight?: boolean;
	gap?: GridGap;
	gapDesktop?: GridGap;
	gapTablet?: GridGap;
	justifyContent?: ContentValues;
	justifyItems?: "center" | "end" | "start" | "stretch";
	placeContent?: ContentValues;
	placeItems?: "center" | "end" | "start" | "stretch";
	tag?:
		| "article"
		| "aside"
		| "div"
		| "dl"
		| "main"
		| "nav"
		| "ol"
		| "section"
		| "ul";
}

const Grid: React.FC<GridProps> = React.memo(
	({
		alignment,
		alignItems,
		columns,
		columnsDesktop,
		columnsTablet,
		container,
		className,
		display = "grid",
		equalRowHeight,
		gap,
		gapDesktop,
		gapTablet,
		justifyContent,
		justifyItems,
		placeContent,
		placeItems,
		tag = "div",
		children,
	}) => (
		<GcdsGrid
			alignItems={alignItems}
			alignment={alignment}
			className={className}
			columns={columns}
			columnsDesktop={columnsDesktop}
			columnsTablet={columnsTablet}
			container={container}
			display={display}
			equalRowHeight={equalRowHeight}
				gap={gap}
				gapDesktop={gapDesktop}
				gapTablet={gapTablet}
			justifyContent={justifyContent}
			justifyItems={justifyItems}
			placeContent={placeContent}
			placeItems={placeItems}
			tag={tag}
		>
			{children}
		</GcdsGrid>
	)
);

export default Grid;
