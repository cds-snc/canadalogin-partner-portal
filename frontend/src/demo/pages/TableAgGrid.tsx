import React from "react";
import { DateModified, Heading, TanStackTable, Text } from "../components";

const TableAgGrid: React.FC = () => {
	return (
		<section>
			<Heading tag="h1">AG Grid table</Heading>
			<Text>
				This is the preferred data-table implementation for the frontend. It
				supports filtering, sorting, pagination, and CSV export from one shared
				component.
			</Text>
			<TanStackTable layout="scroll" />
			<DateModified>2026-03-17</DateModified>
		</section>
	);
};

export default TableAgGrid;
