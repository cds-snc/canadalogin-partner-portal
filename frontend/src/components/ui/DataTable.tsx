import { useMemo, type ReactElement, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import Input from "./Input";
import Link from "./Link";
import Table, { type TableColumn } from "./Table";

export type DataTableColumn<Row extends Record<string, unknown>> = {
	cellRenderer?: (row: Row) => ReactNode;
	field: keyof Row & string;
	headerName: string;
	maxWidth?: number;
	minWidth?: number;
	pinned?: "left" | "right";
	rowHeader?: boolean;
	sortable?: boolean;
	valueFormatter?: (row: Row) => string;
};

type DataTableActionBase<Row extends Record<string, unknown>> = {
	buttonId?: (row: Row) => string | undefined;
	buttonLabel: string;
	buttonRole?: "primary" | "secondary" | "danger" | "start";
	isVisible?: (row: Row) => boolean;
	screenReaderLabel?: (row: Row) => string;
};

export type DataTableAction<Row extends Record<string, unknown>> =
	DataTableActionBase<Row> &
		(
			| {
					href: (row: Row) => string;
					onAction?: never;
					variant?: "link";
			  }
			| {
					href?: never;
					onAction: (row: Row) => void;
					variant?: "button" | "link";
			  }
		);

export type DataTableToolbarAction = {
	buttonId?: string;
	buttonLabel: string;
	onAction: () => void;
};

export type DataTableProps<Row extends Record<string, unknown>> = {
	action?: DataTableAction<Row> | Array<DataTableAction<Row>>;
	actionHeader?: string;
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
	sort?: boolean;
	summary?: string;
	title?: string;
};

const DEFAULT_COLLECTION_CONTROLS_THRESHOLD = 12;

const DataTable = <Row extends Record<string, unknown>>({
	action,
	actionHeader,
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
	sort,
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
	const showCollectionControlsByDefault =
		rows.length > DEFAULT_COLLECTION_CONTROLS_THRESHOLD;
	const effectiveSort = sort ?? rows.length > 1;
	const gcdsColumns = useMemo<Array<TableColumn<Row>>>(() => {
		const baseColumns = columns.map((col): TableColumn<Row> => {
			const renderCell = col.cellRenderer;
			const formatValue = col.valueFormatter;

			return {
				field: col.field,
				header: col.headerName,
				rowHeader: col.rowHeader,
				sort: effectiveSort && (col.sortable ?? true),
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
				header: actionHeader ?? t("common.actions"),
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
							{visibleActions.map((a, index) => {
								const actionContent = (
									<>
										{a.buttonLabel}
										{a.screenReaderLabel ? (
											<>
												{" "}
												<span className="sr-only">
													{a.screenReaderLabel(rowData)}
												</span>
											</>
										) : null}
									</>
								);

								if (a.href) {
									return (
										<Button
											key={index}
											buttonId={a.buttonId?.(rowData)}
											buttonRole={a.buttonRole ?? "secondary"}
											href={a.href(rowData)}
											type="link"
										>
											{actionContent}
										</Button>
									);
								}

								return a.variant !== "link" ? (
									<Button
										key={index}
										buttonId={a.buttonId?.(rowData)}
										buttonRole={a.buttonRole ?? "secondary"}
										type="button"
										onGcdsClick={() => {
											a.onAction(rowData);
										}}
									>
										{actionContent}
									</Button>
								) : (
									<Link
										key={index}
										className="gcds-button-link"
										href="#"
										onGcdsClick={(event) => {
											event.preventDefault();
											a.onAction(rowData);
										}}
									>
										{actionContent}
									</Link>
								);
							})}
						</div>
					);
				},
			},
		];
	}, [action, actionHeader, columns, effectiveSort, t]);

	return (
		<div className="grid gap-300">
			{summary ? <p>{summary}</p> : null}
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
					caption={title}
					columns={gcdsColumns}
					data={searchIsInvalid ? [] : visibleRows}
					pagination={paginationProp ?? showCollectionControlsByDefault}
					sort={effectiveSort}
					filter={
						filter ?? (!onSearchChange && showCollectionControlsByDefault)
					}
				/>
			)}
		</div>
	);
};

export default DataTable;
