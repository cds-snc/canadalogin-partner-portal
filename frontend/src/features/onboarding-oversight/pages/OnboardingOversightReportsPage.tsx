import {
	startTransition,
	useEffect,
	useMemo,
	useState,
	type FormEvent,
} from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { getRequestErrorNotice } from "@/fetch";
import {
	getOnboardingOversightReportExportUrl,
	getWorkspaceReportExportUrl,
	type OnboardingOversightReportRead,
	type OnboardingOversightReportRowRead,
} from "@/fetch/onboarding-oversight";
import {
	Button,
	DataTable,
	DateInput,
	Grid,
	Heading,
	Link,
	Notice,
	Select,
	Text,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { useOnboardingOversightReport } from "../hooks/use-onboarding-oversight-report";
import {
	normalizeOnboardingOversightReportFilters,
	onboardingOversightReportGroupByOptions,
	onboardingOversightReportMetrics,
	supportsOnboardingOversightGrouping,
	type OnboardingOversightReportFilters,
	type OnboardingOversightReportGroupBy,
	type OnboardingOversightReportMetric,
} from "../report-filters";

type Translate = (
	key: string | Array<string>,
	options?: Record<string, unknown>
) => string;

type KPI = {
	label: string;
	value: string;
};

type ReportTableRow = {
	approvedCount?: string;
	bucketLabel: string;
	compliantRpApplications?: string;
	conversionRate?: string;
	hygieneRate?: string;
	invitationsAccepted?: string;
	invitationsSent?: string;
	launchedCount?: string;
	nonCompliantRpApplications?: string;
	submittedCount?: string;
	totalRpApplications?: string;
};

const metricLabel = (
	t: Translate,
	metric: OnboardingOversightReportMetric
): string => {
	switch (metric) {
		case "onboarding_throughput":
			return t("onboardingOversight.reports.metricOnboardingThroughput");
		case "invitation_conversion":
			return t("onboardingOversight.reports.metricInvitationConversion");
		case "secret_rotation_hygiene":
			return t("onboardingOversight.reports.metricSecretRotationHygiene");
		default:
			return metric;
	}
};

const groupByLabel = (
	t: Translate,
	groupBy: OnboardingOversightReportGroupBy
): string => {
	switch (groupBy) {
		case "day":
			return t("onboardingOversight.reports.groupByDay");
		case "week":
			return t("onboardingOversight.reports.groupByWeek");
		case "month":
			return t("onboardingOversight.reports.groupByMonth");
	}
};

const formatNumber = (value: number | null | undefined): string =>
	(value ?? 0).toLocaleString();

const formatPercent = (value: number | null | undefined): string =>
	`${(value ?? 0).toFixed(1)}%`;

const reportRowsToTableRows = (
	report: OnboardingOversightReportRead | null
): Array<ReportTableRow> => {
	if (!report) {
		return [];
	}

	return report.rows.map((row: OnboardingOversightReportRowRead) => ({
		approvedCount: formatNumber(row.approvedCount),
		bucketLabel: row.bucketLabel,
		compliantRpApplications: formatNumber(row.compliantRpApplications),
		conversionRate: formatPercent(row.conversionRate),
		hygieneRate: formatPercent(row.hygieneRate),
		invitationsAccepted: formatNumber(row.invitationsAccepted),
		invitationsSent: formatNumber(row.invitationsSent),
		launchedCount: formatNumber(row.launchedCount),
		nonCompliantRpApplications: formatNumber(row.nonCompliantRpApplications),
		submittedCount: formatNumber(row.submittedCount),
		totalRpApplications: formatNumber(row.totalRpApplications),
	}));
};

const reportColumns = (
	t: Translate,
	metric: OnboardingOversightReportMetric
): Array<DataTableColumn<ReportTableRow>> => {
	if (metric === "onboarding_throughput") {
		return [
			{
				field: "bucketLabel",
				headerName: t("onboardingOversight.reports.bucketColumn"),
			},
			{
				field: "submittedCount",
				headerName: t("onboardingOversight.reports.submittedColumn"),
			},
			{
				field: "approvedCount",
				headerName: t("onboardingOversight.reports.approvedColumn"),
			},
			{
				field: "launchedCount",
				headerName: t("onboardingOversight.reports.launchedColumn"),
			},
		];
	}

	if (metric === "invitation_conversion") {
		return [
			{
				field: "bucketLabel",
				headerName: t("onboardingOversight.reports.bucketColumn"),
			},
			{
				field: "invitationsSent",
				headerName: t("onboardingOversight.reports.sentColumn"),
			},
			{
				field: "invitationsAccepted",
				headerName: t("onboardingOversight.reports.acceptedColumn"),
			},
			{
				field: "conversionRate",
				headerName: t("onboardingOversight.reports.conversionRateColumn"),
			},
		];
	}

	return [
		{
			field: "bucketLabel",
			headerName: t("onboardingOversight.reports.bucketColumn"),
		},
		{
			field: "totalRpApplications",
			headerName: t("onboardingOversight.reports.totalApplicationsColumn"),
		},
		{
			field: "compliantRpApplications",
			headerName: t("onboardingOversight.reports.compliantApplicationsColumn"),
		},
		{
			field: "nonCompliantRpApplications",
			headerName: t(
				"onboardingOversight.reports.nonCompliantApplicationsColumn"
			),
		},
		{
			field: "hygieneRate",
			headerName: t("onboardingOversight.reports.hygieneRateColumn"),
		},
	];
};

const reportKpis = (
	t: Translate,
	report: OnboardingOversightReportRead | null
): Array<KPI> => {
	if (!report) {
		return [];
	}

	if (report.metric === "onboarding_throughput") {
		return [
			{
				label: t("onboardingOversight.reports.submittedColumn"),
				value: formatNumber(report.summary.submittedCount),
			},
			{
				label: t("onboardingOversight.reports.approvedColumn"),
				value: formatNumber(report.summary.approvedCount),
			},
			{
				label: t("onboardingOversight.reports.launchedColumn"),
				value: formatNumber(report.summary.launchedCount),
			},
		];
	}

	if (report.metric === "invitation_conversion") {
		return [
			{
				label: t("onboardingOversight.reports.sentColumn"),
				value: formatNumber(report.summary.invitationsSent),
			},
			{
				label: t("onboardingOversight.reports.acceptedColumn"),
				value: formatNumber(report.summary.invitationsAccepted),
			},
			{
				label: t("onboardingOversight.reports.conversionRateColumn"),
				value: formatPercent(report.summary.conversionRate),
			},
		];
	}

	return [
		{
			label: t("onboardingOversight.reports.totalApplicationsColumn"),
			value: formatNumber(report.summary.totalRpApplications),
		},
		{
			label: t("onboardingOversight.reports.compliantApplicationsColumn"),
			value: formatNumber(report.summary.compliantRpApplications),
		},
		{
			label: t("onboardingOversight.reports.hygieneRateColumn"),
			value: formatPercent(report.summary.hygieneRate),
		},
	];
};

type ReportFiltersFormProps = {
	initialFilters: OnboardingOversightReportFilters;
	onSubmit: (filters: OnboardingOversightReportFilters) => void;
	t: Translate;
};

const ReportFiltersForm = ({
	initialFilters,
	onSubmit,
	t,
}: ReportFiltersFormProps): FunctionComponent => {
	const [draftFilters, setDraftFilters] =
		useState<OnboardingOversightReportFilters>(initialFilters);
	const showGroupBy = supportsOnboardingOversightGrouping(draftFilters.metric);

	const handleFilterSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		onSubmit(draftFilters);
	};

	return (
		<form
			className="flex flex-col gap-300 rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300"
			onSubmit={handleFilterSubmit}
		>
			<Heading tag="h2">
				{t("onboardingOversight.reports.filtersTitle")}
			</Heading>
			<div className="grid gap-300 md:grid-cols-2 xl:grid-cols-4">
				<Select
					label={t("onboardingOversight.reports.filtersMetricLabel")}
					name="metric"
					selectId="oversight-report-metric"
					value={draftFilters.metric}
					onInput={(event): void => {
						const nextMetric = (event.target as HTMLSelectElement)
							.value as OnboardingOversightReportMetric;
						setDraftFilters((currentFilters) =>
							normalizeOnboardingOversightReportFilters({
								...currentFilters,
								groupBy: currentFilters.groupBy,
								metric: nextMetric,
							})
						);
					}}
				>
					{onboardingOversightReportMetrics.map((value) => (
						<option key={value} value={value}>
							{metricLabel(t, value)}
						</option>
					))}
				</Select>
				<DateInput
					required
					format="full"
					legend={t("onboardingOversight.reports.filtersStartDateLabel")}
					max={draftFilters.endDate}
					name="oversight-report-start-date"
					value={draftFilters.startDate}
					onInput={(event): void => {
						setDraftFilters((currentFilters) => ({
							...currentFilters,
							startDate: (event.target as HTMLInputElement).value,
						}));
					}}
				/>
				<DateInput
					required
					format="full"
					legend={t("onboardingOversight.reports.filtersEndDateLabel")}
					min={draftFilters.startDate}
					name="oversight-report-end-date"
					value={draftFilters.endDate}
					onInput={(event): void => {
						setDraftFilters((currentFilters) => ({
							...currentFilters,
							endDate: (event.target as HTMLInputElement).value,
						}));
					}}
				/>
				{showGroupBy ? (
					<Select
						label={t("onboardingOversight.reports.filtersGroupByLabel")}
						name="groupBy"
						selectId="oversight-report-group-by"
						value={draftFilters.groupBy ?? "week"}
						onInput={(event): void => {
							setDraftFilters((currentFilters) => ({
								...currentFilters,
								groupBy: (event.target as HTMLSelectElement)
									.value as OnboardingOversightReportGroupBy,
							}));
						}}
					>
						{onboardingOversightReportGroupByOptions.map((value) => (
							<option key={value} value={value}>
								{groupByLabel(t, value)}
							</option>
						))}
					</Select>
				) : null}
			</div>
			<div className="flex flex-wrap gap-200">
				<Button type="submit">
					{t("onboardingOversight.reports.applyAction")}
				</Button>
			</div>
		</form>
	);
};

type AggregateReportsPageContentProps = {
	accessNoticeBody: string;
	accessNoticeTitle: string;
	filters: OnboardingOversightReportFilters;
	onFilterSubmit: (filters: OnboardingOversightReportFilters) => void;
	pageTitle: string;
	returnHref?: string;
	returnLabel?: string;
	summary: string;
	workspaceUuid?: string;
};

export const AggregateReportsPageContent = ({
	accessNoticeBody,
	accessNoticeTitle,
	filters,
	onFilterSubmit,
	pageTitle,
	returnHref,
	returnLabel,
	summary,
	workspaceUuid,
}: AggregateReportsPageContentProps): FunctionComponent => {
	const { t } = useTranslation() as unknown as { t: Translate };
	const normalizedSearch = normalizeOnboardingOversightReportFilters(filters);
	const filterFormKey = JSON.stringify(normalizedSearch);
	const [lastSuccessfulReport, setLastSuccessfulReport] =
		useState<OnboardingOversightReportRead | null>(null);
	const { error, isLoading, isRefetching, refetch, report } =
		useOnboardingOversightReport(normalizedSearch, workspaceUuid);

	useEffect(() => {
		if (!report) {
			return;
		}

		startTransition(() => {
			setLastSuccessfulReport(report);
		});
	}, [report]);

	const displayedReport = report ?? lastSuccessfulReport;
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "onboardingOversight.reports.errorBody",
		titleKey: "onboardingOversight.reports.errorTitle",
	});
	const tableRows = useMemo(
		() => reportRowsToTableRows(displayedReport),
		[displayedReport]
	);
	const columns = useMemo(
		() => reportColumns(t, displayedReport?.metric ?? normalizedSearch.metric),
		[displayedReport?.metric, normalizedSearch.metric, t]
	);
	const kpis = useMemo(
		() => reportKpis(t, displayedReport),
		[displayedReport, t]
	);
	const exportHref = displayedReport?.exportAvailable
		? workspaceUuid
			? getWorkspaceReportExportUrl(
					workspaceUuid,
					normalizeOnboardingOversightReportFilters(
						displayedReport.appliedFilters
					)
				)
			: getOnboardingOversightReportExportUrl(
					normalizeOnboardingOversightReportFilters(
						displayedReport.appliedFilters
					)
				)
		: undefined;

	return (
		<Grid columns="1fr" tag="div">
			<Heading tag="h1">{pageTitle}</Heading>
			<Text>{summary}</Text>
			<Notice
				noticeRole="info"
				noticeTitle={accessNoticeTitle}
				noticeTitleTag="h2"
			>
				<Text>{accessNoticeBody}</Text>
			</Notice>

			<ReportFiltersForm
				key={filterFormKey}
				initialFilters={normalizedSearch}
				t={t}
				onSubmit={onFilterSubmit}
			/>
			{exportHref ? (
				<div className="flex flex-wrap gap-200">
					<Button href={exportHref} type="link">
						{t("onboardingOversight.reports.exportAction")}
					</Button>
				</div>
			) : null}

			{isLoading || isRefetching ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("onboardingOversight.reports.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("onboardingOversight.reports.loadingBody")}</Text>
				</Notice>
			) : null}

			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey)}</Text>
					<Button
						type="button"
						onGcdsClick={() => {
							void refetch();
						}}
					>
						{t("onboardingOversight.reports.retryAction")}
					</Button>
				</Notice>
			) : null}

			{displayedReport?.metric === "secret_rotation_hygiene" ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("onboardingOversight.reports.policyWindowTitle")}
					noticeTitleTag="h2"
				>
					<Text>
						{t("onboardingOversight.reports.policyWindowBody", {
							days: displayedReport.summary.policyWindowDays ?? 0,
						})}
					</Text>
				</Notice>
			) : null}

			{!isLoading && !isRefetching && displayedReport && kpis.length > 0 ? (
				<section>
					<div className="flex flex-wrap items-center justify-between gap-200">
						<Heading tag="h2">
							{t("onboardingOversight.reports.resultsTitle", {
								metric: metricLabel(t, displayedReport.metric),
							})}
						</Heading>
						<Text>
							{t("onboardingOversight.reports.resultsPeriod", {
								endDate: displayedReport.appliedFilters.endDate,
								startDate: displayedReport.appliedFilters.startDate,
							})}
						</Text>
					</div>
					<div className="mt-300 grid gap-200 md:grid-cols-3">
						{kpis.map((kpi) => (
							<div
								key={kpi.label}
								className="rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300"
							>
								<h3 className="gcds-heading gcds-heading--h3">{kpi.label}</h3>
								<p className="mt-100 text-2xl font-semibold text-[var(--gcds-text-primary)]">
									{kpi.value}
								</p>
							</div>
						))}
					</div>
				</section>
			) : null}

			{!isLoading &&
			!isRefetching &&
			displayedReport &&
			tableRows.length === 0 ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("onboardingOversight.reports.emptyTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("onboardingOversight.reports.emptyBody")}</Text>
				</Notice>
			) : null}

			{displayedReport && tableRows.length > 0 ? (
				<DataTable
					columns={columns}
					filter={false}
					itemLabel={t("onboardingOversight.reports.tableTitle")}
					pagination={false}
					rows={tableRows}
					title={t("onboardingOversight.reports.tableTitle")}
				/>
			) : null}
			{returnHref && returnLabel ? (
				<div className="flex flex-wrap gap-200">
					<Link href={returnHref}>{returnLabel}</Link>
				</div>
			) : null}
		</Grid>
	);
};

export const OnboardingOversightReportsPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as { t: Translate };
	const navigate = useNavigate();
	const search = useSearch({ from: "/onboarding-oversight/reports" });
	const normalizedSearch = normalizeOnboardingOversightReportFilters(search);

	return (
		<AggregateReportsPageContent
			accessNoticeBody={t("onboardingOversight.reports.accessNoticeBody")}
			accessNoticeTitle={t("onboardingOversight.reports.accessNoticeTitle")}
			filters={normalizedSearch}
			pageTitle={t("onboardingOversight.reports.pageTitle")}
			summary={t("onboardingOversight.reports.summary")}
			onFilterSubmit={(filters): void => {
				void navigate({
					search: normalizeOnboardingOversightReportFilters(filters),
					to: "/onboarding-oversight/reports",
				});
			}}
		/>
	);
};
