import React from "react";

// Components (internal)
import { DateModified, Heading, TanStackTable, Text } from "../components";

const TableTanStackScroll: React.FC = () => {
	return (
		<section className="section-tan-stack">
			<Heading tag="h1">Shared data table (scroll)</Heading>
			<Text>
				Scroll layout keeps the new shared AG Grid table compact when the page
				needs a fixed-height grid with horizontal overflow support.
			</Text>

			<TanStackTable layout="scroll" />

			<DateModified>2026-03-17</DateModified>
		</section>
	);
};

export default TableTanStackScroll;
