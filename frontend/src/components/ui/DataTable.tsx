import {
	useDeferredValue,
	useMemo,
	useRef,
	useState,
	type ChangeEvent,
	type KeyboardEvent,
	type ReactElement,
	type ReactNode,
} from "react";
import { AgGridReact } from "ag-grid-react";
import Button from "./Button";
import {
	ClientSideRowModelModule,
	CsvExportModule,
	DateFilterModule,
	type ColDef,
	type ColDefField,
	type GridApi,
	type GridReadyEvent,
	type ICellRendererParams,
	type ModelUpdatedEvent,
	ModuleRegistry,
	PaginationModule,
	QuickFilterModule,
	RowApiModule,
	TextFilterModule,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "./DataTable.css";

ModuleRegistry.registerModules([
	ClientSideRowModelModule,
	PaginationModule,
	TextFilterModule,
	DateFilterModule,
	QuickFilterModule,
	RowApiModule,
	CsvExportModule,
]);

export type DataTableColumn<Row extends Record<string, unknown>> = {
	cellRenderer?: (row: Row) => ReactNode;
	field: ColDefField<Row, unknown>;
	filter?: boolean | string;
	headerName: string;
	maxWidth?: number;
	minWidth?: number;
	pinned?: "left" | "right";
	sortable?: boolean;
	valueFormatter?: (row: Row) => string;
};

export type DataTableAction<Row extends Record<string, unknown>> = {
	buttonId?: (row: Row) => string | undefined;
	buttonLabel: string;
	isVisible?: (row: Row) => boolean;
	onAction: (row: Row) => void;
	screenReaderLabel?: (row: Row) => string;
	variant?: "button" | "link";
};

export type DataTableToolbarAction = {
	buttonId?: string;
	buttonLabel: string;
	onAction: () => void;
};

export type DataTableProps<Row extends Record<string, unknown>> = {
	action?: DataTableAction<Row> | Array<DataTableAction<Row>>;
	columns: Array<DataTableColumn<Row>>;
	emptyMessage?: string;
	exportFileName?: string;
	exportLabel?: string;
	getRowId?: (row: Row) => string;
	itemLabel: string;
	layout?: "scroll" | "stacked";
	onSearchChange?: (query: string) => void;
	onSearchSubmit?: (query: string) => void;
	pageNumber?: number;
	pagination?: boolean;
	primaryAction?: DataTableToolbarAction;
	actionColumnWidth?: { max?: number; min?: number };
	rows: Array<Row>;
	searchLabel?: string;
	searchQuery?: string;
	searchPlaceholder?: string;
	summary?: string;
	title?: string;
};

const DataTable = <Row extends Record<string, unknown>>({
	action,
	columns,
	emptyMessage = "No rows found.",
	exportFileName = "table-export.csv",
	exportLabel = "Export CSV",
	getRowId,
	itemLabel,
	layout = "stacked",
	onSearchChange,
	pageNumber,
	onSearchSubmit,
	pagination = true,
	primaryAction,
	actionColumnWidth,
	rows,
	searchLabel = "Search table",
	searchQuery: controlledSearchQuery,
	searchPlaceholder = "Filter rows",
	summary,
	title = "Data table",
}: DataTableProps<Row>): ReactElement => {
	const gridApiReference = useRef<GridApi<Row> | null>(null);
	const [internalSearchQuery, setInternalSearchQuery] = useState("");
	const [visibleRowCount, setVisibleRowCount] = useState<number>(rows.length);
	const searchQuery = controlledSearchQuery ?? internalSearchQuery;
	const deferredSearchQuery = useDeferredValue(searchQuery);

	const columnDefinitions = useMemo<Array<ColDef<Row>>>(() => {
		const baseColumns = columns.map((column): ColDef<Row> => {
			const renderCell = column.cellRenderer;
			const formatValue = column.valueFormatter;

			return {
				field: column.field,
				filter: column.filter ?? "agTextColumnFilter",
				headerName: column.headerName,
				maxWidth: column.maxWidth,
				minWidth: column.minWidth ?? 160,
				pinned: column.pinned,
				sortable: column.sortable ?? true,
				cellRenderer: renderCell
					? (parameters: ICellRendererParams<Row>): ReactNode =>
							parameters.data ? renderCell(parameters.data) : null
					: undefined,
				valueFormatter: formatValue
					? (parameters): string =>
							parameters.data ? formatValue(parameters.data) : ""
					: undefined,
			};
		});

		if (!action) {
			return baseColumns;
		}

		const actions = Array.isArray(action) ? action : [action];

		return [
			...baseColumns,
			{
				filter: false,
				headerName: "Actions",
				maxWidth: actionColumnWidth?.max ?? 200,
				minWidth: actionColumnWidth?.min ?? 150,
				sortable: false,
				cellRenderer: (parameters: ICellRendererParams<Row>): ReactNode => {
					const rowData = parameters.data;

					if (!rowData) {
						return null;
					}

					const visibleActions = actions.filter(
						(a) => !a.isVisible || a.isVisible(rowData)
					);

					if (visibleActions.length === 0) {
						return null;
					}

					return (
						<div className="flex gap-100">
							{visibleActions.map((a, index) => (
								<button
									key={index}
									className={`government-data-table__action${a.variant === "link" ? " government-data-table__action--link" : ""}`}
									id={a.buttonId?.(rowData)}
									type="button"
									onClick={(): void => {
										a.onAction(rowData);
									}}
								>
									{a.buttonLabel}
									{a.screenReaderLabel ? (
										<span className="visibility-sr-only">
											{" "}
											{a.screenReaderLabel(rowData)}
										</span>
									) : null}
								</button>
							))}
						</div>
					);
				},
			},
		];
	}, [action, actionColumnWidth, columns]);

	const defaultColumnDefinition = useMemo<ColDef<Row>>(
		() => ({
			filter: "agTextColumnFilter",
			flex: 1,
			floatingFilter: false,
			resizable: true,
			sortable: true,
		}),
		[]
	);

	const handleGridReady = (event: GridReadyEvent<Row>): void => {
		gridApiReference.current = event.api;
		setVisibleRowCount(
			pagination ? event.api.getDisplayedRowCount() : rows.length
		);
	};

	const handleModelUpdated = (event: ModelUpdatedEvent<Row>): void => {
		setVisibleRowCount(
			pagination ? event.api.getDisplayedRowCount() : rows.length
		);
	};

	const handleExport = (): void => {
		gridApiReference.current?.exportDataAsCsv({ fileName: exportFileName });
	};

	const summaryText =
		summary ??
		`Showing ${visibleRowCount} ${itemLabel}${pageNumber ? ` on page ${pageNumber}` : ""}`;

	return (
		<section
			className={`government-data-table government-data-table--${layout}`}
		>
			<div className="government-data-table__header">
				<div className="government-data-table__heading-group">
					<div>
						<h2 className="government-data-table__title">{title}</h2>
						<p aria-live="polite" className="government-data-table__summary">
							{summaryText}
						</p>
					</div>
					{primaryAction ? (
						<Button
							buttonId={primaryAction.buttonId}
							className="government-data-table__create"
							type="button"
							onGcdsClick={primaryAction.onAction}
						>
							{primaryAction.buttonLabel}
						</Button>
					) : null}
				</div>
				<div className="government-data-table__toolbar">
					<label
						className="government-data-table__search"
						htmlFor={`${title}-search`}
					>
						<span>{searchLabel}</span>
						<input
							id={`${title}-search`}
							name={`${title}-search`}
							placeholder={searchPlaceholder}
							type="search"
							value={searchQuery}
							onChange={(event: ChangeEvent<HTMLInputElement>): void => {
								if (controlledSearchQuery === undefined) {
									setInternalSearchQuery(event.target.value);
								}

								onSearchChange?.(event.target.value);
							}}
							onKeyDown={(event: KeyboardEvent<HTMLInputElement>): void => {
								if (event.key !== "Enter" || !onSearchSubmit) {
									return;
								}

								event.preventDefault();
								onSearchSubmit(searchQuery.trim());
							}}
						/>
					</label>
					<div className="government-data-table__toolbar-actions">
						<Button
							buttonRole="secondary"
							type="button"
							onGcdsClick={handleExport}
						>
							{exportLabel}
						</Button>
					</div>
				</div>
			</div>

			<div className="government-data-table__surface ag-theme-quartz">
				<AgGridReact<Row>
					columnDefs={columnDefinitions}
					defaultColDef={defaultColumnDefinition}
					domLayout={layout === "stacked" ? "autoHeight" : "normal"}
					overlayNoRowsTemplate={`<span class="government-data-table__empty">${emptyMessage}</span>`}
					pagination={pagination}
					paginationPageSize={10}
					paginationPageSizeSelector={pagination ? false : undefined}
					quickFilterText={deferredSearchQuery}
					rowData={[...rows]}
					suppressCellFocus={false}
					theme="legacy"
					getRowId={
						getRowId
							? (parameters): string => getRowId(parameters.data)
							: undefined
					}
					onGridReady={handleGridReady}
					onModelUpdated={handleModelUpdated}
				/>
			</div>
		</section>
	);
};

export default DataTable;
