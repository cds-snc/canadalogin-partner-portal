import { useMemo, type ReactElement, type ReactNode } from "react";
import Table, { type TableColumn } from "./Table";

export type DataTableColumn<Row extends Record<string, unknown>> = {
	cellRenderer?: (row: Row) => ReactNode;
	field: keyof Row & string;
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
	pagination: paginationProp,
	rows,
	title = "Data table",
}: DataTableProps<Row>): ReactElement => {
	const gcdsColumns = useMemo<Array<TableColumn<Row>>>(() => {
		const baseColumns = columns.map((col): TableColumn<Row> => {
			const renderCell = col.cellRenderer;
			const formatValue = col.valueFormatter;

			return {
				field: col.field,
				header: col.headerName,
				sort: col.sortable ?? true,
				renderCell: renderCell
					? ({ row }): ReactNode => renderCell(row ?? {})
					: formatValue
						? ({ row }): ReactNode => formatValue(row)
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
				field: "_actions",
				header: "Actions",
				sort: false,
				renderCell: ({ row }): ReactNode => {
					const rowData = row as unknown as Row | null;
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
								<a
									key={index}
									className="gcds-button-link"
									href="#"
									onClick={(e) => {
										e.preventDefault();
										a.onAction(rowData);
									}}
								>
									{a.buttonLabel}
									{a.screenReaderLabel ? (
										<span className="gcds-sr-only">
											{" "}
											{a.screenReaderLabel(rowData)}
										</span>
									) : null}
								</a>
							))}
						</div>
					);
				},
			},
		];
	}, [action, columns]);

	return (
		<Table
			filter
			sort
			caption={title}
			columns={gcdsColumns}
			data={rows}
			pagination={paginationProp ?? true}
		/>
	);
};

export default DataTable;
