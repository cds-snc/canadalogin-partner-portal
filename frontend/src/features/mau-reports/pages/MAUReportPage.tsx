import { useMemo, useState, type FormEvent } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { MAUDailyTrendLineChart } from "@/components/charts/line/MAUDailyTrendLineChart";
import { Breadcrumbs, CenteredPageLayout } from "@/components/layout";
import { Button, DataTable, DateInput, Heading, Notice, Text } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { getRequestErrorNotice } from "@/fetch";
import type { MAUReportItemRead, MAUReportResponseRead } from "@/fetch/mau-report";
import { useMauReport } from "../hooks/use-mau-report";

type KPI = {
	label: string;
	value: number;
};

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

const parseDateValue = (value: string): number => {
	return Date.parse(`${value}T00:00:00.000Z`);
};

const toSuccessRate = (record: MAUReportItemRead): number => {
	if (record.total_logins <= 0) {
		return 0;
	}

	return Number(
		((record.successful_logins / record.total_logins) * 100).toFixed(2)
	);
};

const formatDisplayDate = (value: string): string => {
	return value;
};

const exportToCSV = (
	records: Array<MAUReportItemRead>,
	filename: string
): void => {
	const headers = [
		"date",
		"total_logins",
		"unique_users",
		"successful_logins",
		"failed_logins",
		"mtd_unique_users",
		"success_rate",
	];
	const csvRows = [headers.join(",")];

	for (const record of records) {
		csvRows.push(
			[
				record.date,
				record.total_logins,
				record.unique_users,
				record.successful_logins,
				record.failed_logins,
				record.mtd_unique_users,
				`${toSuccessRate(record)}%`,
			].join(",")
		);
	}

	const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
};

export const MAUReportPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { rpApplicationUuid } = useParams({
		from: "/rp-applications/mine/$rpApplicationUuid/mau-report",
	});
	const rpApplicationUuidValue = String(rpApplicationUuid);
	const defaultDateRange = useMemo(() => buildDefaultDateRange(), []);
	const [draftStartDate, setDraftStartDate] = useState(
		defaultDateRange.startDate
	);
	const [draftEndDate, setDraftEndDate] = useState(defaultDateRange.endDate);
	const [activeStartDate, setActiveStartDate] = useState(
		defaultDateRange.startDate
	);
	const [activeEndDate, setActiveEndDate] = useState(defaultDateRange.endDate);

	const { data, error, isLoading, isRefetching } = useMauReport(
		rpApplicationUuidValue,
		activeStartDate,
		activeEndDate
	);

	const responseData = data as MAUReportResponseRead | null;

	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "mauReport.errorBody",
		titleKey: "mauReport.errorTitle",
	});

	const orderedRecords = useMemo(() => {
		const records = responseData?.records ?? [];
		return [...records].sort(
			(a, b) => parseDateValue(b.date) - parseDateValue(a.date)
		);
	}, [responseData?.records]);

	const latestRecord = useMemo(() => {
		if (orderedRecords.length === 0) {
			return null;
		}

		return orderedRecords[0] ?? null;
	}, [orderedRecords]);

	const kpis = useMemo<Array<KPI>>(() => {
		if (!latestRecord) {
			return [];
		}

		return [
			{
				label: t("mauReport.metrics.totalLogin"),
				value: latestRecord.total_logins,
			},
			{
				label: t("mauReport.metrics.uniqueUser"),
				value: latestRecord.unique_users,
			},
			{
				label: t("mauReport.metrics.successLogin"),
				value: latestRecord.successful_logins,
			},
			{
				label: t("mauReport.metrics.failedLogin"),
				value: latestRecord.failed_logins,
			},
			{
				label: t("mauReport.metrics.mtdUniqueUser"),
				value: latestRecord.mtd_unique_users,
			},
		];
	}, [latestRecord, t]);

	const sectionDate = useMemo(() => {
		if (!latestRecord) {
			return "";
		}

		return formatDisplayDate(latestRecord.date);
	}, [latestRecord]);

	const trendPoints = useMemo(
		() =>
			orderedRecords.map((record) => ({
				date: record.date,
				totalLogins: record.total_logins,
				uniqueUsers: record.unique_users,
				successLogins: record.successful_logins,
				failedLogins: record.failed_logins,
			})),
		[orderedRecords]
	);

	const mauTableColumns = useMemo<Array<DataTableColumn<MAUReportItemRead>>>(
		() => [
			{ field: "date", headerName: t("mauReport.table.date") },
			{
				cellRenderer: (row): string => row.total_logins.toLocaleString(),
				field: "total_logins",
				headerName: t("mauReport.table.totalLogin"),
				sortable: true,
			},
			{
				cellRenderer: (row): string => row.unique_users.toLocaleString(),
				field: "unique_users",
				headerName: t("mauReport.table.uniqueUser"),
				sortable: true,
			},
			{
				cellRenderer: (row): string => row.successful_logins.toLocaleString(),
				field: "successful_logins",
				headerName: t("mauReport.table.successLogin"),
				sortable: true,
			},
			{
				cellRenderer: (row): string => row.failed_logins.toLocaleString(),
				field: "failed_logins",
				headerName: t("mauReport.table.failedLogin"),
				sortable: true,
			},
			{
				cellRenderer: (row): string => row.mtd_unique_users.toLocaleString(),
				field: "mtd_unique_users",
				headerName: t("mauReport.table.mtdUniqueUser"),
				sortable: true,
			},
			{
				cellRenderer: (row): string => `${toSuccessRate(row)}%`,
				field: "successful_logins",
				headerName: t("mauReport.table.successRate"),
				sortable: false,
			},
		],
		[t]
	);

	const handleFilterSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		setActiveStartDate(draftStartDate);
		setActiveEndDate(draftEndDate);
	};

	const applicationName = responseData?.application_name ?? "";
	const departmentName = responseData?.department_name ?? null;

	return (
		<CenteredPageLayout className="max-w-6xl gap-600">
			<Breadcrumbs
				items={[
					{ href: "/", label: t("nav.home") },
					{ href: "/dashboard", label: t("nav.dashboard") },
					{
						href: `/rp-applications/mine/${rpApplicationUuidValue}/mau-report`,
						label: t("mauReport.title"),
					},
				]}
			/>

			<Heading tag="h1">
				{applicationName
					? t("mauReport.pageTitle", { applicationName })
					: t("mauReport.title")}
			</Heading>
			{departmentName ? (
				<Text>{t("mauReport.departmentLabel", { department: departmentName })}</Text>
			) : null}

			<div className="mt-200 flex w-full justify-end">
				<Button
					href={`/rp-applications/mine/${rpApplicationUuidValue}`}
					type="link"
				>
					{t("workspaces.backToApplication")}
				</Button>
			</div>

			{isLoading || isRefetching ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("mauReport.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("mauReport.loadingBody")}</Text>
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

			{!isLoading && !errorNotice && latestRecord && sectionDate ? (
				<section>
					<Heading tag="h2">
						{t("mauReport.sectionTitle", { date: sectionDate })}
					</Heading>
					<div className="mt-300 grid gap-200 md:grid-cols-3 lg:grid-cols-5">
						{kpis.map((kpi) => (
							<div key={kpi.label} className="rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300">
								<h3 className="gcds-heading gcds-heading--h3">{kpi.label}</h3>
								<p className="mt-100 text-2xl font-semibold text-[var(--gcds-text-primary)]">
									{kpi.value.toLocaleString()}
								</p>
							</div>
						))}
					</div>
				</section>
			) : null}

			{!isLoading && !errorNotice && orderedRecords.length === 0 ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("mauReport.emptyTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("mauReport.emptyBody")}</Text>
				</Notice>
			) : null}

			<form className="flex flex-col gap-300 rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300" onSubmit={handleFilterSubmit}>
				<div className="grid gap-300 md:grid-cols-2">
					<DateInput
						required
						format="full"
						legend={t("mauReport.filters.startDate")}
						max={draftEndDate}
						name="mau-start-date"
						value={draftStartDate}
						onInput={(event): void => {
							setDraftStartDate((event.target as HTMLInputElement).value);
						}}
					/>
					<DateInput
						required
						format="full"
						legend={t("mauReport.filters.endDate")}
						min={draftStartDate}
						name="mau-end-date"
						value={draftEndDate}
						onInput={(event): void => {
							setDraftEndDate((event.target as HTMLInputElement).value);
						}}
					/>
				</div>
				<div>
					<Button className="w-full md:w-auto" type="submit">
						{t("mauReport.filters.apply")}
					</Button>
				</div>
			</form>

			{!isLoading && !errorNotice && orderedRecords.length > 0 ? (
				<section className="rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300">
					<Heading tag="h2">{t("mauReport.trendChartTitle")}</Heading>
					<Text>{t("mauReport.trendChartBody")}</Text>
					<MAUDailyTrendLineChart points={trendPoints} />
				</section>
			) : null}

			{!isLoading && !errorNotice && orderedRecords.length > 0 ? (
				<section className="rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300">
					<div className="flex items-center justify-between">
						<Heading tag="h2">{t("mauReport.dailyListTitle")}</Heading>
						<Button
							type="button"
							onGcdsClick={(): void => {
								exportToCSV(
									orderedRecords,
									`mau-report-${rpApplicationUuidValue}-${activeStartDate}-${activeEndDate}.csv`
								);
							}}
						>
							{t("mauReport.exportCsv")}
						</Button>
					</div>
					<div className="mt-200 overflow-x-auto">
						<DataTable
							columns={mauTableColumns}
							itemLabel={t("mauReport.dailyListTitle")}
							pagination={false}
							rows={orderedRecords}
							title={t("mauReport.dailyListTitle")}
						/>
					</div>
				</section>
			) : null}
		</CenteredPageLayout>
	);
};
