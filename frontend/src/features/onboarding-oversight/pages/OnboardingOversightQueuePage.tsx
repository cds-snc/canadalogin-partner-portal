import {
	useMemo,
	useState,
	type FormEvent,
	type FormEventHandler,
	type ReactNode,
} from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import {
	Button,
	DataTable,
	Grid,
	Heading,
	Input,
	Notice,
	Select,
	Text,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { getRequestErrorNotice } from "@/fetch";
import { getProductionReviewStatusLabel } from "@/features/workspaces/onboarding-display";
import { useOnboardingOversightQueue } from "../hooks/use-onboarding-oversight-queue";
import {
	normalizeOnboardingOversightQueueFilters,
	onboardingOversightQueueReviewStatuses,
	type OnboardingOversightQueueFilters,
} from "../queue-filters";

type Translate = (
	key: string | Array<string>,
	options?: Record<string, unknown>
) => string;

type QueueTableRow = Record<string, unknown> & {
	activityAt: string;
	applicationName: string;
	configurationName: string;
	departmentName: string;
	detailPath: string;
	externalReviewReference: string;
	reviewer: string;
	reviewStatus: string;
	rpConfigurationUuid: string;
	workspaceName: string;
};

const formatDateTime = (
	value: string | null | undefined,
	language: string,
	fallback: string
): string => {
	if (!value) return fallback;
	const parsedValue = new Date(value);
	if (Number.isNaN(parsedValue.getTime())) return value;
	return parsedValue.toLocaleString(language, {
		dateStyle: "medium",
		timeStyle: "short",
	});
};

const readInputValue = (event: Event): string => {
	const target = event.target as HTMLInputElement | HTMLSelectElement | null;
	return target?.value ?? "";
};

const hasActiveFilters = (filters: OnboardingOversightQueueFilters): boolean =>
	Object.values(filters).some(
		(value) => typeof value === "string" && value.trim() !== ""
	);

type QueueFiltersFormProps = {
	initialFilters: OnboardingOversightQueueFilters;
	onClear: () => void;
	onSubmit: (filters: OnboardingOversightQueueFilters) => void;
	t: Translate;
};

const QueueFiltersForm = ({
	initialFilters,
	onClear,
	onSubmit,
	t,
}: QueueFiltersFormProps): FunctionComponent => {
	const [draftFilters, setDraftFilters] =
		useState<OnboardingOversightQueueFilters>(initialFilters);
	const setDraftFilter = <Key extends keyof OnboardingOversightQueueFilters>(
		key: Key,
		value: OnboardingOversightQueueFilters[Key]
	): void => {
		setDraftFilters((currentFilters) => ({
			...currentFilters,
			[key]: value,
		}));
	};
	const handleTextFilterInput =
		(key: "department" | "workspace"): FormEventHandler<Element> =>
		(event): void => {
			setDraftFilter(key, readInputValue(event.nativeEvent));
		};
	const handleFilterSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		onSubmit(draftFilters);
	};

	return (
		<form className="grid gap-300" onSubmit={handleFilterSubmit}>
			<Heading tag="h2">{t("onboardingOversight.queue.filtersTitle")}</Heading>
			<Grid
				columns="1fr"
				columnsDesktop="repeat(3, 1fr)"
				columnsTablet="1fr 1fr"
			>
				<Input
					inputId="oversight-queue-workspace"
					label={t("onboardingOversight.queue.filtersWorkspaceLabel")}
					name="workspace"
					type="search"
					value={draftFilters.workspace ?? ""}
					onInput={handleTextFilterInput("workspace")}
				/>
				<Input
					inputId="oversight-queue-department"
					label={t("onboardingOversight.queue.filtersDepartmentLabel")}
					name="department"
					type="search"
					value={draftFilters.department ?? ""}
					onInput={handleTextFilterInput("department")}
				/>
				<Select
					label={t("onboardingOversight.queue.filtersReviewStatusLabel")}
					name="reviewStatus"
					selectId="oversight-queue-review-status"
					value={draftFilters.reviewStatus ?? ""}
					onInput={(event): void => {
						setDraftFilter(
							"reviewStatus",
							readInputValue(event.nativeEvent) as
								OnboardingOversightQueueFilters["reviewStatus"] | undefined
						);
					}}
				>
					<option value="">{t("onboardingOversight.queue.anyOption")}</option>
					{onboardingOversightQueueReviewStatuses.map((value) => (
						<option key={value} value={value}>
							{getProductionReviewStatusLabel(t, value)}
						</option>
					))}
				</Select>
			</Grid>
			<div className="flex flex-wrap gap-200">
				<Button type="submit">
					{t("onboardingOversight.queue.applyAction")}
				</Button>
				<Button buttonRole="secondary" type="button" onGcdsClick={onClear}>
					{t("onboardingOversight.queue.clearAction")}
				</Button>
			</div>
		</form>
	);
};

export const OnboardingOversightQueuePage = (): FunctionComponent => {
	const { i18n, t } = useTranslation() as unknown as {
		i18n: { resolvedLanguage?: string };
		t: Translate;
	};
	const navigate = useNavigate();
	const search = useSearch({ from: "/onboarding-oversight/queue" });
	const normalizedSearch = normalizeOnboardingOversightQueueFilters(search);
	const { error, isLoading, isRefetching, queueRows } =
		useOnboardingOversightQueue(normalizedSearch);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "onboardingOversight.queue.errorBody",
		titleKey: "onboardingOversight.queue.errorTitle",
	});
	const language = i18n.resolvedLanguage ?? "en";
	const unavailable = t("onboardingOversight.queue.notApplicable");

	const tableRows = useMemo<Array<QueueTableRow>>(
		() =>
			queueRows.map((row) => ({
				activityAt: formatDateTime(
					row.decidedAt ?? row.reviewedAt ?? row.updatedAt ?? row.requestedAt,
					language,
					unavailable
				),
				applicationName:
					(language.toLowerCase().startsWith("fr")
						? row.applicationNameFr
						: row.applicationNameEn
					).trim() ||
					(language.toLowerCase().startsWith("fr")
						? row.applicationNameEn
						: row.applicationNameFr
					).trim(),
				configurationName: row.configurationName,
				departmentName: row.departmentName ?? unavailable,
				detailPath: row.detailPath,
				externalReviewReference:
					row.externalReviewReference.trim() || unavailable,
				reviewer:
					row.reviewedByTeam?.trim() ||
					row.reviewedByUserUuid?.trim() ||
					unavailable,
				reviewStatus: getProductionReviewStatusLabel(t, row.reviewStatus),
				rpConfigurationUuid: row.rpConfigurationUuid,
				workspaceName: row.workspaceName,
			})),
		[language, queueRows, t, unavailable]
	);

	const columns = useMemo<Array<DataTableColumn<QueueTableRow>>>(
		() => [
			{
				field: "applicationName",
				headerName: t("onboardingOversight.queue.applicationColumn"),
				cellRenderer: (row): ReactNode => (
					<div className="grid gap-50">
						<span>{row.applicationName}</span>
						<small>{row.configurationName}</small>
					</div>
				),
			},
			{
				field: "workspaceName",
				headerName: t("onboardingOversight.queue.workspaceColumn"),
			},
			{
				field: "departmentName",
				headerName: t("onboardingOversight.queue.departmentColumn"),
			},
			{
				field: "reviewStatus",
				headerName: t("onboardingOversight.queue.reviewStatusColumn"),
			},
			{
				field: "externalReviewReference",
				headerName: t(
					"onboardingOversight.queue.externalReviewReferenceColumn"
				),
			},
			{
				field: "reviewer",
				headerName: t("onboardingOversight.queue.reviewerColumn"),
			},
			{
				field: "activityAt",
				headerName: t("onboardingOversight.queue.lastActivityAtColumn"),
			},
		],
		[t]
	);

	const handleFilterSubmit = (
		filters: OnboardingOversightQueueFilters
	): void => {
		void navigate({
			to: "/onboarding-oversight/queue",
			search: normalizeOnboardingOversightQueueFilters(filters),
		});
	};
	const handleFilterClear = (): void => {
		void navigate({
			to: "/onboarding-oversight/queue",
			search: normalizeOnboardingOversightQueueFilters({}),
		});
	};

	return (
		<div className="grid gap-400">
			<div>
				<Heading tag="h1">{t("onboardingOversight.queue.pageTitle")}</Heading>
				<Text>{t("onboardingOversight.queue.summary")}</Text>
			</div>
			<Notice
				noticeRole="info"
				noticeTitle={t("onboardingOversight.queue.accessNoticeTitle")}
				noticeTitleTag="h2"
			>
				<Text>{t("onboardingOversight.queue.accessNoticeBody")}</Text>
			</Notice>
			<QueueFiltersForm
				key={JSON.stringify(normalizedSearch)}
				initialFilters={normalizedSearch}
				t={t}
				onClear={handleFilterClear}
				onSubmit={handleFilterSubmit}
			/>
			{isLoading || isRefetching ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("onboardingOversight.queue.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("onboardingOversight.queue.loadingBody")}</Text>
				</Notice>
			) : null}
			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey)}</Text>
				</Notice>
			) : null}
			{!isLoading && !isRefetching && !errorNotice && tableRows.length === 0 ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("onboardingOversight.queue.emptyTitle")}
					noticeTitleTag="h2"
				>
					<Text>
						{hasActiveFilters(normalizedSearch)
							? t("onboardingOversight.queue.emptyFilteredBody")
							: t("onboardingOversight.queue.emptyBody")}
					</Text>
				</Notice>
			) : null}
			{!errorNotice && tableRows.length > 0 ? (
				<DataTable
					columns={columns}
					filter={false}
					itemLabel={t("onboardingOversight.queue.tableTitle")}
					rows={tableRows}
					title={t("onboardingOversight.queue.tableTitle")}
					action={{
						buttonLabel: t("onboardingOversight.queue.viewAction"),
						onAction: (row): void => {
							void navigate({ to: row.detailPath });
						},
						screenReaderLabel: (row): string =>
							`${row.applicationName}: ${row.configurationName}`,
					}}
				/>
			) : null}
		</div>
	);
};
