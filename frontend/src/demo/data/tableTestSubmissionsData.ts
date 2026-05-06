export const tableTestSubmissionColumns = {
	assigned_reviewer: "Assigned reviewer",
	date_submitted: "Date submitted",
	submission_id: "Submission ID",
	status: "Status",
	submitter_name: "Submitter name",
} as const;

export const tableTestSubmissionData = [
	{
		assigned_reviewer: "Alex Martin",
		date_submitted: "2026-03-10T09:15:00Z",
		submission_id: "SUB-1001",
		status: "Pending review",
		submitter_name: "Jane Doe",
	},
	{
		assigned_reviewer: "Priya Chen",
		date_submitted: "2026-03-11T14:40:00Z",
		submission_id: "SUB-1002",
		status: "Approved",
		submitter_name: "Omar Rahman",
	},
	{
		assigned_reviewer: "Samira Roy",
		date_submitted: "2026-03-12T16:05:00Z",
		submission_id: "SUB-1003",
		status: "Needs changes",
		submitter_name: "Li Wei",
	},
	{
		assigned_reviewer: "Alex Martin",
		date_submitted: "2026-03-13T08:25:00Z",
		submission_id: "SUB-1004",
		status: "In review",
		submitter_name: "Fatima Noor",
	},
] as const;
