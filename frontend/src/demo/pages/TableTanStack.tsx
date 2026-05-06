import React from "react";

// Components (internal)
export { default as TableTanStack } from "./TableTanStack";
import { DateModified, Heading, TanStackTable, Text } from "../components";

const TableTanStack: React.FC = () => {
	return (
		<section className="section-tan-stack">
			<Heading tag="h1">Shared data table</Heading>
			<Text>
				The old TanStack sample now points at the shared AG Grid implementation
				so the frontend uses one stronger table system wherever rich tabular
				data is needed.
			</Text>

			<Heading tag="h2">Responsive layout</Heading>
			<TanStackTable />

			<Heading tag="h2">Scrollable layout</Heading>
			<TanStackTable layout="scroll" />

			<DateModified>2026-03-17</DateModified>
		</section>
	);
};

export default TableTanStack;
