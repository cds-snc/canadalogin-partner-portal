import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { MAUDailyTrendLineChart } from "@/components/charts/line/MAUDailyTrendLineChart";
import {
	Button,
	DataTable,
	DateInput,
	Heading,
	Notice,
	Text,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { getRequestErrorNotice } from "@/fetch";
import { HttpRequestError } from "@/fetch/errors";
import type {
	MAUReportItemRead,
	MAUReportResponseRead,
} from "@/fetch/mau-report";
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

const exportToCSV = (
	records: Array<MAUReportItemRead>,
	filename: string
): void => {
	const headers = ["date", "total_logins", "unique_users", "mtd_unique_users"];
	const csvRows = [headers.join(",")];

	for (const record of records) {
		csvRows.push(
			[
				record.date,
				record.total_logins,
				record.unique_users,
				record.mtd_unique_users,
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
	const { i18n, t } = useTranslation();
	const { rpApplicationUuid } = useParams({
		from: "/your-applications/$rpApplicationUuid/mau-report",
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

	useEffect(() => {
		if (
			error instanceof HttpRequestError &&
			error.status === 409 &&
			error.code === "rp_application_department_required"
		) {
			globalThis.location.replace(
				`/your-applications/${rpApplicationUuidValue}/department-setup`
			);
		}
	}, [error, rpApplicationUuidValue]);

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

	const kpis = useMemo<Array<KPI>>(() => {
		if (orderedRecords.length === 0) {
			return [];
		}

		const totalLogins = orderedRecords.reduce(
			(sum, r) => sum + r.total_logins,
			0
		);
		const uniqueUsers = orderedRecords.reduce(
			(sum, r) => sum + r.unique_users,
			0
		);

		return [
			{
				label: t("mauReport.metrics.totalLogin"),
				value: totalLogins,
			},
			{
				label: t("mauReport.metrics.uniqueUser"),
				value: uniqueUsers,
			},
		];
	}, [orderedRecords, t]);

	const lang = i18n.resolvedLanguage ?? "en";

	const formatDate = (dateStr: string): string =>
		new Date(`${dateStr}T00:00:00`).toLocaleDateString(lang, {
			year: "numeric",
			month: "long",
			day: "numeric",
		});

	const trendPoints = useMemo(
		() =>
			[...orderedRecords].reverse().map((record) => ({
				date: record.date,
				totalLogins: record.total_logins,
				uniqueUsers: record.unique_users,
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
				cellRenderer: (row): string => row.mtd_unique_users.toLocaleString(),
				field: "mtd_unique_users",
				headerName: t("mauReport.table.mtdUniqueUser"),
				sortable: true,
			},
		],
		[t]
	);

	const handleFilterSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		setActiveStartDate(draftStartDate);
		setActiveEndDate(draftEndDate);
	};

	const departmentName = responseData?.department_name ?? null;

	return (
		<div className="flex flex-col gap-400">
			<Heading tag="h1">{t("mauReport.pageTitle")}</Heading>
			{departmentName ? (
				<Text>
					{t("mauReport.departmentLabel", { department: departmentName })}
				</Text>
			) : null}

			<form
				className="flex flex-col gap-300 rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300"
				onSubmit={handleFilterSubmit}
			>
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

			{!isLoading &&
			!isRefetching &&
			!errorNotice &&
			orderedRecords.length > 0 ? (
				<section>
					<Heading tag="h2">
						{t("mauReport.sectionTitle", {
							startDate: formatDate(activeStartDate),
							endDate: formatDate(activeEndDate),
						})}
					</Heading>
					<div className="mt-300 grid gap-200 md:grid-cols-3 lg:grid-cols-3">
						{kpis.map((kpi) => (
							<div
								key={kpi.label}
								className="rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300"
							>
								<h3 className="gcds-heading gcds-heading--h3">{kpi.label}</h3>
								<p className="mt-100 text-2xl font-semibold text-[var(--gcds-text-primary)]">
									{kpi.value.toLocaleString()}
								</p>
							</div>
						))}
					</div>
				</section>
			) : null}

			{!isLoading &&
			!isRefetching &&
			!errorNotice &&
			orderedRecords.length === 0 ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("mauReport.emptyTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("mauReport.emptyBody")}</Text>
				</Notice>
			) : null}

			{!isLoading &&
			!isRefetching &&
			!errorNotice &&
			orderedRecords.length > 0 ? (
				<section className="rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300">
					<Heading tag="h2">{t("mauReport.trendChartTitle")}</Heading>
					<Text>{t("mauReport.trendChartBody")}</Text>
					<MAUDailyTrendLineChart points={trendPoints} />
				</section>
			) : null}

			{!isLoading &&
			!isRefetching &&
			!errorNotice &&
			orderedRecords.length > 0 ? (
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
		</div>
	);
};
