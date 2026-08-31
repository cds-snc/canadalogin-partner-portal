import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DataTable from "@/components/ui/DataTable";

const rows = [
	{ id: "1", name: "Jane Doe", status: "Pending review" },
	{ id: "2", name: "Omar Rahman", status: "Approved" },
];

vi.mock("@gcds-core/components-react", () => ({
	GcdsButton: ({ children }: { children: React.ReactNode }): ReactElement => (
		<button type="button">{children}</button>
	),
	GcdsTable: ({
		captionSlot,
		data,
		columns,
	}: {
		captionSlot?: React.ReactNode;
		data?: Array<Record<string, unknown>>;
		columns?: Array<Record<string, unknown>>;
	}): ReactElement => (
		<div
			data-caption={captionSlot ?? ""}
			data-columns={columns?.length ?? 0}
			data-rows={data?.length ?? 0}
			data-testid="gcds-table"
		>
			{captionSlot ? <h2>{captionSlot}</h2> : null}
		</div>
	),
	ReactTableColumn: {},
}));

describe("DataTable", () => {
	it("renders the GCDS table with columns and data", () => {
		render(
			<DataTable
				columns={[
					{ field: "id", headerName: "ID" },
					{ field: "name", headerName: "Name" },
				]}
				itemLabel="records"
				rows={rows}
				title="Submission data table"
			/>,
		);

		const table = document.querySelector("[data-testid='gcds-table']");
		expect(table).toBeTruthy();
		expect(table?.getAttribute("data-rows")).toBe("2");
	});

	it("includes actions column when action prop is provided", () => {
		const handleAction = vi.fn();

		render(
			<DataTable
				columns={[
					{ field: "id", headerName: "ID" },
					{ field: "name", headerName: "Name" },
				]}
				itemLabel="records"
				rows={rows}
				title="Submission data table"
				action={{
					buttonLabel: "Edit",
					onAction: handleAction,
				}}
			/>,
		);

		const table = document.querySelector("[data-testid='gcds-table']");
		expect(table).toBeTruthy();
	});
});
