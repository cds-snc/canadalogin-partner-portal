import type React from "react";
import {
	GcdsTable,
	type ReactTableColumn,
} from "@gcds-core/components-react";

export type TableColumn<T = Record<string, unknown>> = ReactTableColumn<T>;

export interface TableProps<T = Record<string, unknown>> {
	children?: React.ReactNode;
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
}: TableProps<T>): React.ReactElement => (
	<GcdsTable
		captionSlot={caption}
		className={className}
		columns={columns as Array<ReactTableColumn> | undefined}
		data={data as Array<Record<string, unknown>> | undefined}
		filter={filter}
		pagination={pagination}
		sort={sort}
	>
		{children}
	</GcdsTable>
);

export default Table;
