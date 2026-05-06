import DataTable, {
	type DataTableColumn,
	type DataTableProps,
} from "@/components/ui/DataTable";
import StatusPill, { type StatusType } from "./StatusPill";
import { tableTestSubmissionData } from "@/demo/data/tableTestSubmissionsData";
import "./TanStackTable.css";

type SampleSubmissionRow = {
	assigned_reviewer: string;
	date_submitted: string;
	status: StatusType;
	submission_id: string;
	submitter_name: string;
};

const sampleRows: Array<SampleSubmissionRow> = tableTestSubmissionData.map(
	(row) => ({
		assigned_reviewer: row.assigned_reviewer,
		date_submitted: new Date(row.date_submitted).toLocaleDateString("en-CA", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		}),
		status:
			row.status === "Approved"
				? "approved"
				: row.status === "Pending review"
					? "pending"
					: row.status === "In review"
						? "under-review"
						: "rejected",
		submission_id: row.submission_id,
		submitter_name: row.submitter_name,
	})
);

const sampleColumns: Array<DataTableColumn<SampleSubmissionRow>> = [
	{ field: "submission_id", headerName: "Submission ID", minWidth: 170 },
	{ field: "submitter_name", headerName: "Submitter", minWidth: 180 },
	{ field: "assigned_reviewer", headerName: "Reviewer", minWidth: 180 },
	{ field: "date_submitted", headerName: "Submitted", minWidth: 180 },
	{
		cellRenderer: (row) => <StatusPill status={row.status} />,
		field: "status",
		filter: false,
		headerName: "Status",
		minWidth: 180,
		valueFormatter: (row) => row.status,
	},
];

const TanStackTable = ({
	layout = "stacked",
}: Pick<DataTableProps<Record<string, unknown>>, "layout">) => (
	<DataTable
		columns={sampleColumns}
		exportFileName="sample-submissions.csv"
		itemLabel="sample submissions"
		layout={layout}
		rows={sampleRows}
		title="Sample submissions"
	/>
);

export default TanStackTable;
