import { useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import {
	Button,
	DataTable,
	DateInput,
	Heading,
	Notice,
	Pagination,
	Text,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { getRequestErrorNotice } from "@/fetch";
import type { AuditLogRead } from "@/fetch/audit-logs";
import { useAdminListState, useAuditLogs } from "@/hooks";

const formatDayForInput = (value: Date): string => {
	const year = value.getFullYear();
	const month = String(value.getMonth() + 1).padStart(2, "0");
	const day = String(value.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const buildDefaultDateRange = (): { endDate: string; startDate: string } => {
	const now = new Date();
	const start = new Date(now);
	start.setDate(start.getDate() - 30);
	return {
		endDate: formatDayForInput(now),
		startDate: formatDayForInput(start),
	};
};

type AuditLogTableRow = {
	createdAt: string;
	description: string;
	operation: string;
	target: string;
	targetUuid: string;
	user: string;
	userUuid: string;
	uuid: string;
};

export const AuditLogsPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { page, setPage } = useAdminListState("audit-logs");
	const itemsPerPage = 10;
	const defaultDateRange = useMemo(() => buildDefaultDateRange(), []);

	const [draftStartDate, setDraftStartDate] = useState(
		defaultDateRange.startDate
	);
	const [draftEndDate, setDraftEndDate] = useState(defaultDateRange.endDate);
	const [activeStartDate, setActiveStartDate] = useState(
		defaultDateRange.startDate
	);
	const [activeEndDate, setActiveEndDate] = useState(defaultDateRange.endDate);

	const { auditLogs, error, isLoading, response } = useAuditLogs(
		page,
		itemsPerPage,
		activeStartDate,
		activeEndDate
	);

	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "auditLogs.errorBody",
		titleKey: "auditLogs.errorTitle",
	});

	const auditLogRows: Array<AuditLogTableRow> = auditLogs.map(
		(log: AuditLogRead) => ({
			createdAt: log.createdAt,
			description: log.description,
			operation: log.operation,
			target: log.target,
			targetUuid: log.targetUuid ?? "",
			user: log.user,
			userUuid: log.userUuid ?? "",
			uuid: log.uuid,
		})
	);

	const auditLogColumns: Array<DataTableColumn<AuditLogTableRow>> = [
		{ field: "user", headerName: t("auditLogs.userLabel"), sortable: true },
		{ field: "userUuid", headerName: t("auditLogs.userUuidLabel") },
		{ field: "target", headerName: t("auditLogs.targetLabel"), sortable: true },
		{ field: "targetUuid", headerName: t("auditLogs.targetUuidLabel") },
		{ field: "operation", headerName: t("auditLogs.operationLabel") },
		{ field: "description", headerName: t("auditLogs.descriptionLabel") },
		{ field: "createdAt", headerName: t("auditLogs.createdAtLabel") },
	];

	const totalPages = response
		? Math.max(
				1,
				Math.ceil(response["total_count"] / response["items_per_page"])
			)
		: 1;

	const handleFilterSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		setPage(1);
		setActiveStartDate(draftStartDate);
		setActiveEndDate(draftEndDate);
	};

	return (
		<>
			<Heading tag="h1">{t("auditLogs.title")}</Heading>
			<Text>{t("auditLogs.summary")}</Text>

			<form
				className="mb-400 mt-300 flex flex-col gap-300 rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300"
				onSubmit={handleFilterSubmit}
			>
				<div className="grid gap-300 md:grid-cols-2">
					<DateInput
						format="full"
						legend={t("auditLogs.startDateLabel")}
						max={draftEndDate}
						name="audit-start-date"
						value={draftStartDate}
						onInput={(event): void => {
							setDraftStartDate((event.target as HTMLInputElement).value);
						}}
					/>
					<DateInput
						format="full"
						legend={t("auditLogs.endDateLabel")}
						min={draftStartDate}
						name="audit-end-date"
						value={draftEndDate}
						onInput={(event): void => {
							setDraftEndDate((event.target as HTMLInputElement).value);
						}}
					/>
				</div>
				<div>
					<Button className="w-full md:w-auto" type="submit">
						{t("auditLogs.filterAction")}
					</Button>
				</div>
			</form>

			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("auditLogs.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("auditLogs.loadingBody")}</Text>
				</Notice>
			) : null}

			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey as never)}</Text>
				</Notice>
			) : null}

			{!isLoading && !error && auditLogs.length === 0 ? (
				<Notice
					noticeRole="warning"
					noticeTitle={t("auditLogs.emptyTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("auditLogs.emptyBody")}</Text>
				</Notice>
			) : null}

			{auditLogs.length > 0 ? (
				<div className="grid gap-300">
					<DataTable
						columns={auditLogColumns}
						exportFileName="audit-logs.csv"
						getRowId={(row) => row.uuid}
						itemLabel="auditLogs"
						pageNumber={response?.page ?? page}
						pagination={false}
						rows={auditLogRows}
						title={t("auditLogs.title")}
					/>
					<Pagination
						currentPage={page}
						label="Audit logs pagination"
						totalPages={totalPages}
						onPageChange={setPage}
					/>
				</div>
			) : null}
		</>
	);
};
