import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { PropsWithChildren, ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import DataTable from "@/components/ui/DataTable";

const rows = [
	{ id: "1", name: "Jane Doe", status: "Pending review" },
	{ id: "2", name: "Omar Rahman", status: "Approved" },
];

vi.mock("ag-grid-community", () => ({
	ClientSideRowModelModule: {},
	CsvExportModule: {},
	DateFilterModule: {},
	ModuleRegistry: {
		registerModules: vi.fn(),
	},
	PaginationModule: {},
	QuickFilterModule: {},
	RowApiModule: {},
	TextFilterModule: {},
}));

vi.mock("ag-grid-react", () => ({
	AgGridReact: ({ quickFilterText, rowData }: { quickFilterText?: string; rowData?: Array<unknown> }) => (
		<div data-filter={quickFilterText ?? ""} data-rows={rowData?.length ?? 0} data-testid="ag-grid" />
	),
}));

vi.mock("@gcds-core/components-react", () => ({
	GcdsButton: ({ children, disabled, onGcdsClick, type }: PropsWithChildren<{ disabled?: boolean; onGcdsClick?: () => void; type?: "button" | "submit" | "reset" | "link" }>): ReactElement => (
		<button disabled={disabled} onClick={onGcdsClick} type={type === "link" ? "button" : (type ?? "button")}>
			{children}
		</button>
	),
}));

describe("DataTable", () => {
	it("renders the AG Grid table with search support", async () => {
		render(
			<DataTable
				columns={[
					{ field: "id", headerName: "ID" },
					{ field: "name", headerName: "Name" },
				]}
				itemLabel="records"
				rows={rows}
				searchLabel="Search submissions"
				title="Submission data table"
			/>,
		);

		expect(screen.getByRole("heading", { level: 2, name: /submission data table/i })).toBeTruthy();
		expect(screen.getByText(/showing 2 records/i)).toBeTruthy();
		expect(screen.getByTestId("ag-grid").getAttribute("data-rows")).toBe("2");

		fireEvent.input(screen.getByRole("searchbox", { name: /search submissions/i }), {
			target: { value: "Jane" },
		});

		await waitFor(() => {
			expect(screen.getByTestId("ag-grid").getAttribute("data-filter")).toBe("Jane");
		});
	});

	it("submits search on Enter when a backend search handler is provided", () => {
		const handleSearchSubmit = vi.fn();

		render(
			<DataTable
				columns={[
					{ field: "id", headerName: "ID" },
					{ field: "name", headerName: "Name" },
				]}
				itemLabel="records"
				onSearchSubmit={handleSearchSubmit}
				rows={rows}
				searchLabel="Search submissions"
				title="Submission data table"
			/>,
		);

		const searchbox = screen.getByRole("searchbox", { name: /search submissions/i });

		fireEvent.input(searchbox, { target: { value: "Omar" } });
		fireEvent.keyDown(searchbox, { key: "Enter" });

		expect(handleSearchSubmit).toHaveBeenCalledWith("Omar");
	});

	it("uses controlled search state when provided", async () => {
		const handleSearchChange = vi.fn();

		const { rerender } = render(
			<DataTable
				columns={[
					{ field: "id", headerName: "ID" },
					{ field: "name", headerName: "Name" },
				]}
				itemLabel="records"
				onSearchChange={handleSearchChange}
				rows={rows}
				searchLabel="Search submissions"
				searchQuery="Pending"
				title="Submission data table"
			/>,
		);

		const searchbox = screen.getByRole("searchbox", { name: /search submissions/i });

		expect((searchbox as HTMLInputElement).value).toBe("Pending");

		fireEvent.input(searchbox, { target: { value: "Approved" } });
		expect(handleSearchChange).toHaveBeenCalledWith("Approved");

		rerender(
			<DataTable
				columns={[
					{ field: "id", headerName: "ID" },
					{ field: "name", headerName: "Name" },
				]}
				itemLabel="records"
				onSearchChange={handleSearchChange}
				rows={rows}
				searchLabel="Search submissions"
				searchQuery="Approved"
				title="Submission data table"
			/>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("ag-grid").getAttribute("data-filter")).toBe("Approved");
		});
	});
});