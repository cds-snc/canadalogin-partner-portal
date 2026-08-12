import { useMemo, type ReactElement, type ReactNode } from "react";
import { GcdsTable, type ReactTableColumn } from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";

export type TableColumn<T = Record<string, unknown>> = ReactTableColumn<T>;

export interface TableProps<T = Record<string, unknown>> {
	children?: ReactNode;
	className?: string;
	columns?: Array<TableColumn<T>>;
	caption?: string;
	data?: Array<T>;
	filter?: boolean;
	pagination?: boolean;
	sort?: boolean;
}

const Table = <T extends Record<string, unknown>>({
	children,
	className,
	columns,
	caption,
	data,
	filter = false,
	pagination = false,
	sort = false,
}: TableProps<T>): ReactElement => {
	const { i18n } = useTranslation();
	const lang = i18n.language?.startsWith("fr") ? "fr" : "en";
	// GCDS renders managed React content only when the column also opts into the
	// core table's slot contract. The 1.3.1 React adapter marks it managed but
	// does not add this flag itself.
	const compatibleColumns = useMemo(
		() =>
			columns?.map((column) =>
				column.renderCell ? { ...column, slotted: true } : column
			),
		[columns]
	);

	return (
		<GcdsTable
			captionSlot={caption}
			className={className}
			data={data}
			filter={filter}
			lang={lang}
			pagination={pagination}
			sort={sort}
			columns={
				compatibleColumns as
					Array<ReactTableColumn<Record<string, unknown>>> | undefined
			}
		>
			{children}
		</GcdsTable>
	);
};

export default Table;
