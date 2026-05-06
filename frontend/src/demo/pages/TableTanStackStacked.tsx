import React from "react";

// Components (internal)
import { DateModified, Heading, TanStackTable, Text } from "../components";

const TableTanStackStacked: React.FC = () => {
	return (
		<section className="section-tan-stack">
			<Heading tag="h1">Shared data table (responsive)</Heading>
			<Text>
				Responsive layout uses the same AG Grid-backed component but expands to
				full content height for simpler page integrations.
			</Text>

			<TanStackTable />

			<DateModified>2026-03-17</DateModified>
		</section>
	);
};

export default TableTanStackStacked;
