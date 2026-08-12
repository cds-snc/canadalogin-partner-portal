import type { ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DataTable from "@/components/ui/DataTable";

const rows = [
	{ id: "1", name: "Jane Doe", status: "Pending review" },
	{ id: "2", name: "Omar Rahman", status: "Approved" },
];

vi.mock("@gcds-core/components-react", () => ({
	GcdsButton: ({
		children,
		onClickCapture,
		onKeyDownCapture,
		onKeyUpCapture,
	}: {
		children: React.ReactNode;
		onClickCapture?: React.MouseEventHandler<HTMLButtonElement>;
		onKeyDownCapture?: React.KeyboardEventHandler<HTMLButtonElement>;
		onKeyUpCapture?: React.KeyboardEventHandler<HTMLButtonElement>;
	}): ReactElement => (
		<button
			type="button"
			onClickCapture={onClickCapture}
			onKeyDownCapture={onKeyDownCapture}
			onKeyUpCapture={onKeyUpCapture}
		>
			{children}
		</button>
	),
	GcdsInput: ({
		inputId,
		label,
		ref,
		value,
	}: {
		inputId: string;
		label: string;
		ref?: React.Ref<HTMLGcdsInputElement>;
		value?: string;
	}): ReactElement => (
		<div ref={ref as React.Ref<HTMLDivElement>} data-gcds-input>
			<label htmlFor={inputId}>
				{label}
				<input
					readOnly
					id={inputId}
					value={value}
					onInput={(event): void => {
						const host = event.currentTarget.closest(
							"[data-gcds-input]"
						) as unknown as HTMLGcdsInputElement;
						host.value = event.currentTarget.value;
						host.dispatchEvent(new CustomEvent("gcdsInput", { bubbles: true }));
					}}
				/>
			</label>
		</div>
	),
	GcdsTable: ({
		captionSlot,
		data,
		columns,
		filter,
	}: {
		captionSlot?: React.ReactNode;
		data?: Array<Record<string, unknown>>;
		columns?: Array<Record<string, unknown>>;
		filter?: boolean;
	}): ReactElement => (
		<div
			data-caption={captionSlot ?? ""}
			data-columns={columns?.length ?? 0}
			data-filter={filter ? "true" : "false"}
			data-rows={data?.length ?? 0}
			data-testid="gcds-table"
		>
			{captionSlot ? <h2>{captionSlot}</h2> : null}
			{columns?.map((column, index) => {
				const renderCell = column["renderCell"] as
					| ((properties: { row: Record<string, unknown> }) => React.ReactNode)
					| undefined;
				// Match GCDS's real slot contract: renderCell content is projected only
				// when the column is explicitly marked as slotted.
				return renderCell && column["slotted"] === true && data?.[0] ? (
					<div key={index}>{renderCell({ row: data[0] })}</div>
				) : null;
			})}
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
			/>
		);

		const table = document.querySelector("[data-testid='gcds-table']");
		expect(table).toBeTruthy();
		expect(table?.getAttribute("data-rows")).toBe("2");
	});

	it("allows a server-paginated directory to suppress client filtering", () => {
		render(
			<DataTable
				columns={[{ field: "name", headerName: "Name" }]}
				filter={false}
				itemLabel="records"
				rows={rows}
			/>
		);

		expect(screen.getByTestId("gcds-table").getAttribute("data-filter")).toBe(
			"false"
		);
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
			/>
		);

		const table = document.querySelector("[data-testid='gcds-table']");
		expect(table).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Edit" }));
		expect(handleAction).toHaveBeenCalledWith(rows[0]);
	});

	it("keeps row context visually hidden while using it in the accessible action name", () => {
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
					buttonLabel: "Manage",
					onAction: vi.fn(),
					screenReaderLabel: (row) => row.name,
				}}
			/>
		);

		const action = screen.getByRole("button", { name: "Manage Jane Doe" });
		const hiddenContext = action.querySelector("span");

		expect(action.childNodes[0]?.textContent).toBe("Manage");
		expect(hiddenContext?.className).toBe("sr-only");
		expect(hiddenContext?.textContent).toBe("Jane Doe");
	});

	it("renders and invokes the primary table action", () => {
		const handleCreate = vi.fn();

		render(
			<DataTable
				columns={[{ field: "name", headerName: "Name" }]}
				itemLabel="records"
				rows={rows}
				primaryAction={{
					buttonId: "create-record",
					buttonLabel: "Create record",
					onAction: handleCreate,
				}}
			/>
		);

		fireEvent.click(screen.getByRole("button", { name: "Create record" }));
		expect(handleCreate).toHaveBeenCalledOnce();
	});

	it("renders a controlled search and filters the currently returned rows", () => {
		const handleSearchChange = vi.fn();
		render(
			<DataTable
				columns={[{ field: "name", headerName: "Name" }]}
				itemLabel="records"
				rows={rows}
				searchLabel="Search records"
				searchQuery="Omar"
				onSearchChange={handleSearchChange}
			/>
		);

		expect(screen.getByTestId("gcds-table").getAttribute("data-rows")).toBe(
			"1"
		);
		fireEvent.input(screen.getByRole("textbox", { name: "Search records" }), {
			target: { value: "Jane" },
		});
		expect(handleSearchChange).toHaveBeenCalledWith("Jane");
	});

	it("does not refilter results returned by a server-backed search", () => {
		render(
			<DataTable
				columns={[{ field: "name", headerName: "Name" }]}
				itemLabel="records"
				rows={rows}
				searchLabel="Search records"
				searchMode="server"
				searchQuery="backend-only-match"
				onSearchChange={vi.fn()}
			/>
		);

		expect(screen.getByTestId("gcds-table").getAttribute("data-rows")).toBe(
			"2"
		);
	});
});
