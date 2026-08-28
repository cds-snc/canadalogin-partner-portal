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
		href,
		onClickCapture,
		onKeyDownCapture,
		onKeyUpCapture,
	}: {
		children: React.ReactNode;
		href?: string;
		onClickCapture?: React.MouseEventHandler<HTMLButtonElement>;
		onKeyDownCapture?: React.KeyboardEventHandler<HTMLButtonElement>;
		onKeyUpCapture?: React.KeyboardEventHandler<HTMLButtonElement>;
	}): ReactElement =>
		href ? (
			<a href={href}>{children}</a>
		) : (
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
		pagination,
		sort,
	}: {
		captionSlot?: React.ReactNode;
		data?: Array<Record<string, unknown>>;
		columns?: Array<Record<string, unknown>>;
		filter?: boolean;
		pagination?: boolean;
		sort?: boolean;
	}): ReactElement => (
		<div
			data-caption={captionSlot ?? ""}
			data-column-sort={String(columns?.[0]?.["sort"] ?? false)}
			data-columns={columns?.length ?? 0}
			data-filter={filter ? "true" : "false"}
			data-pagination={pagination ? "true" : "false"}
			data-row-header={String(columns?.[0]?.["rowHeader"] ?? false)}
			data-rows={data?.length ?? 0}
			data-sort={sort ? "true" : "false"}
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
	GcdsLink: ({
		children,
		href,
		onClickCapture,
	}: {
		children: React.ReactNode;
		href: string;
		onClickCapture?: React.MouseEventHandler<HTMLAnchorElement>;
	}): ReactElement => (
		<a href={href} onClickCapture={onClickCapture}>
			{children}
		</a>
	),
	ReactTableColumn: {},
}));

describe("DataTable", () => {
	it("renders the GCDS table with columns and data", () => {
		render(
			<DataTable
				columns={[
					{ field: "id", headerName: "ID", rowHeader: true },
					{ field: "name", headerName: "Name" },
				]}
				itemLabel="records"
				rows={rows}
				title="Submission data table"
			/>
		);

		const table = document.querySelector("[data-testid='gcds-table']");
		expect(table).toBeTruthy();
		expect(table?.getAttribute("data-filter")).toBe("false");
		expect(table?.getAttribute("data-pagination")).toBe("false");
		expect(table?.getAttribute("data-rows")).toBe("2");
		expect(table?.getAttribute("data-row-header")).toBe("true");
		expect(table?.getAttribute("data-column-sort")).toBe("true");
		expect(table?.getAttribute("data-sort")).toBe("true");
	});

	it("removes sort controls when only one row is available", () => {
		render(
			<DataTable
				columns={[{ field: "name", headerName: "Name" }]}
				itemLabel="record"
				rows={[rows[0]!]}
			/>
		);

		expect(screen.getByTestId("gcds-table").getAttribute("data-sort")).toBe(
			"false"
		);
		expect(
			screen.getByTestId("gcds-table").getAttribute("data-column-sort")
		).toBe("false");
	});

	it("adds collection controls only when a table is large enough to need them", () => {
		const manyRows = Array.from({ length: 13 }, (_, index) => ({
			id: String(index + 1),
			name: `Record ${index + 1}`,
		}));

		render(
			<DataTable
				columns={[{ field: "name", headerName: "Name" }]}
				itemLabel="records"
				rows={manyRows}
			/>
		);

		expect(screen.getByTestId("gcds-table").getAttribute("data-filter")).toBe(
			"true"
		);
		expect(
			screen.getByTestId("gcds-table").getAttribute("data-pagination")
		).toBe("true");
	});

	it("allows a server-paginated directory to suppress client filtering", () => {
		render(
			<DataTable
				columns={[{ field: "name", headerName: "Name" }]}
				filter={false}
				itemLabel="records"
				pagination={false}
				rows={rows}
				sort={false}
			/>
		);

		expect(screen.getByTestId("gcds-table").getAttribute("data-filter")).toBe(
			"false"
		);
		expect(
			screen.getByTestId("gcds-table").getAttribute("data-pagination")
		).toBe("false");
		expect(screen.getByTestId("gcds-table").getAttribute("data-sort")).toBe(
			"false"
		);
		expect(
			screen.getByTestId("gcds-table").getAttribute("data-column-sort")
		).toBe("false");
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

	it("renders href actions as real GCDS links with row context", () => {
		render(
			<DataTable
				actionHeader="Action"
				columns={[{ field: "name", headerName: "Name", rowHeader: true }]}
				itemLabel="records"
				rows={rows}
				action={{
					buttonLabel: "View record",
					href: (row) => `/records/${row.id}`,
					screenReaderLabel: (row) => `for ${row.name}`,
				}}
			/>
		);

		const link = screen.getByRole("link", {
			name: "View record for Jane Doe",
		});
		expect(link.getAttribute("href")).toBe("/records/1");
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

	it("places the primary action before collection search", () => {
		render(
			<DataTable
				columns={[{ field: "name", headerName: "Name" }]}
				itemLabel="records"
				rows={rows}
				searchLabel="Search records"
				primaryAction={{
					buttonLabel: "Create record",
					onAction: vi.fn(),
				}}
				onSearchChange={vi.fn()}
			/>
		);

		const action = screen.getByRole("button", { name: "Create record" });
		const search = screen.getByRole("textbox", { name: "Search records" });

		expect(
			action.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
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
