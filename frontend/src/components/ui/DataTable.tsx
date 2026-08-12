import { useMemo, type ReactElement, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import Input from "./Input";
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
	buttonRole?: "primary" | "secondary" | "danger" | "start";
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
	filter?: boolean;
	itemLabel: string;
	onSearchChange?: (query: string) => void;
	onSearchSubmit?: (query: string) => void;
	pagination?: boolean;
	primaryAction?: DataTableToolbarAction;
	rows: Array<Row>;
	searchLabel?: string;
	searchLengthError?: string;
	searchMaxLength?: number;
	searchMode?: "client" | "server";
	searchMinLength?: number;
	searchQuery?: string;
	summary?: string;
	title?: string;
};

const DataTable = <Row extends Record<string, unknown>>({
	action,
	columns,
	emptyMessage,
	filter,
	itemLabel,
	onSearchChange,
	onSearchSubmit,
	pagination: paginationProp,
	primaryAction,
	rows,
	searchLabel,
	searchLengthError,
	searchMaxLength,
	searchMode = "client",
	searchMinLength,
	searchQuery = "",
	summary,
	title = "Data table",
}: DataTableProps<Row>): ReactElement => {
	const { t } = useTranslation();
	const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase();
	const searchIsInvalid =
		normalizedSearchQuery.length > 0 &&
		((searchMinLength !== undefined &&
			normalizedSearchQuery.length < searchMinLength) ||
			(searchMaxLength !== undefined &&
				normalizedSearchQuery.length > searchMaxLength));
	const visibleRows = useMemo(
		() =>
			searchMode === "client" &&
			onSearchChange &&
			normalizedSearchQuery.length > 0
				? rows.filter((row) =>
						Object.values(row).some(
							(value) =>
								typeof value === "string" &&
								value.toLocaleLowerCase().includes(normalizedSearchQuery)
						)
					)
				: rows,
		[normalizedSearchQuery, onSearchChange, rows, searchMode]
	);
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
				header: t("common.actions"),
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
							{visibleActions.map((a, index) =>
								a.variant !== "link" ? (
									<Button
										key={index}
										buttonId={a.buttonId?.(rowData)}
										buttonRole={a.buttonRole ?? "secondary"}
										type="button"
										onGcdsClick={() => {
											a.onAction(rowData);
										}}
									>
										{a.buttonLabel}
										{a.screenReaderLabel ? (
											<>
												{" "}
												<span className="sr-only">
													{a.screenReaderLabel(rowData)}
												</span>
											</>
										) : null}
									</Button>
								) : (
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
											<>
												{" "}
												<span className="sr-only">
													{a.screenReaderLabel(rowData)}
												</span>
											</>
										) : null}
									</a>
								)
							)}
						</div>
					);
				},
			},
		];
	}, [action, columns, t]);

	return (
		<div className="grid gap-300">
			{summary ? <p>{summary}</p> : null}
			{onSearchChange && searchLabel ? (
				<div className="grid max-w-prose gap-200">
					<Input
						errorMessage={searchIsInvalid ? searchLengthError : undefined}
						label={searchLabel}
						maxLength={searchMaxLength}
						minLength={searchMinLength}
						name="data-table-search"
						type="search"
						validateOn="other"
						value={searchQuery}
						inputId={`data-table-search-${title
							.toLocaleLowerCase()
							.replace(/[^a-z0-9]+/g, "-")}`}
						onInput={(event): void => {
							onSearchChange((event.target as HTMLInputElement).value);
						}}
						onKeyDown={(event): void => {
							if (event.key === "Enter" && onSearchSubmit && !searchIsInvalid) {
								event.preventDefault();
								onSearchSubmit(searchQuery.trim());
							}
						}}
					/>
					{onSearchSubmit ? (
						<div>
							<Button
								disabled={searchIsInvalid}
								type="button"
								onGcdsClick={() => {
									onSearchSubmit(searchQuery.trim());
								}}
							>
								{t("common.search")}
							</Button>
						</div>
					) : null}
				</div>
			) : null}
			{primaryAction ? (
				<div>
					<Button
						buttonId={primaryAction.buttonId}
						type="button"
						onGcdsClick={primaryAction.onAction}
					>
						{primaryAction.buttonLabel}
					</Button>
				</div>
			) : null}
			<p aria-live="polite">
				{t("common.itemsShown", {
					count: searchIsInvalid ? 0 : visibleRows.length,
					itemLabel,
				})}
			</p>
			{!searchIsInvalid && visibleRows.length === 0 && emptyMessage ? (
				<p>{emptyMessage}</p>
			) : (
				<Table
					sort
					caption={title}
					columns={gcdsColumns}
					data={searchIsInvalid ? [] : visibleRows}
					filter={filter ?? !onSearchChange}
					pagination={paginationProp ?? true}
				/>
			)}
		</div>
	);
};

export default DataTable;
