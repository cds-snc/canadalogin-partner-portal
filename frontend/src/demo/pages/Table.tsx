import React from "react";
// Components (internal)
import { DateModified, Heading, Text } from "../components";

const Table: React.FC = () => {
	return (
		<section>
			<Heading tag="h1">Table test page</Heading>

			<Text>
				This page compares the table experiments in the repo. AG Grid is now the
				preferred shared implementation for rich data tables in the frontend.
			</Text>

			<ul className="list-disc">
				<li>
					<a href="/table-ag-grid">AG Grid table (preferred)</a>
				</li>
				<li>
					<a href="/table/simple">Simple-datatables demo</a>
				</li>
				<li>
					<a href="/table-gridjs">GridJS table demo</a>
				</li>
				<li>
					<a href="/table-tabulator">Tabulator table demo</a>
				</li>
				<li>
					<a href="/table/tan-stack-scroll">Shared table - scroll</a>
				</li>
				<li>
					<a href="/table/tan-stack-stacked">Shared table - responsive</a>
				</li>
			</ul>

			<DateModified>2026-03-17</DateModified>
		</section>
	);
};

export default Table;
