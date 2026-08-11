import {
	useEffect,
	useMemo,
	useState,
	type FormEvent,
	type FormEventHandler,
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
import {
	getWorkspaceOnboardingStateLabel,
	getWorkspacePromotionStatusLabel,
} from "@/features/workspaces/onboarding-display";
import { useOnboardingOversightQueue } from "../hooks/use-onboarding-oversight-queue";
import {
	normalizeOnboardingOversightQueueFilters,
	onboardingOversightQueueEnvironments,
	onboardingOversightQueueLifecycleStates,
	onboardingOversightQueuePromotionStatuses,
	onboardingOversightQueueRecordTypes,
	type OnboardingOversightQueueEnvironment,
	type OnboardingOversightQueueFilters,
	type OnboardingOversightQueueRecordType,
} from "../queue-filters";

type Translate = (
	key: string | Array<string>,
	options?: Record<string, unknown>
) => string;

type QueueTableRow = {
	departmentName: string;
	detailPath: string;
	environment: string;
	externalReviewReference: string;
	lastActivityAt: string;
	onboardingState: string;
	primaryRecordLabel: string;
	promotionStatus: string;
	recordType: string;
	recordUuid: string;
	workspaceName: string;
};

const getRecordTypeLabel = (
	t: Translate,
	recordType: OnboardingOversightQueueRecordType
): string => {
	switch (recordType) {
		case "workspace":
			return t("onboardingOversight.queue.recordTypeWorkspace");
		case "application_information":
			return t("onboardingOversight.queue.recordTypeApplicationInformation");
		case "rp_application":
			return t("onboardingOversight.queue.recordTypeRpApplication");
		case "production_progression":
			return t("onboardingOversight.queue.recordTypeProductionProgression");
	}
};

const getEnvironmentLabel = (
	t: Translate,
	environment: OnboardingOversightQueueEnvironment | null | undefined
): string => {
	switch (environment) {
		case "test":
			return t("yourApplications.environmentTest");
		case "staging":
			return t("yourApplications.environmentStaging");
		case "production":
			return t("yourApplications.environmentProduction");
		default:
			return t("onboardingOversight.queue.notApplicable");
	}
};

const formatDateTime = (value: string | null | undefined, language: string): string => {
	if (!value) {
		return "-";
	}

	const parsedValue = new Date(value);
	if (Number.isNaN(parsedValue.getTime())) {
		return value;
	}

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

export const OnboardingOversightQueuePage = (): FunctionComponent => {
	const { i18n, t } = useTranslation() as unknown as {
		i18n: { resolvedLanguage?: string };
		t: Translate;
	};
	const navigate = useNavigate();
	const search = useSearch({ from: "/onboarding-oversight/queue" });
	const [draftFilters, setDraftFilters] = useState<OnboardingOversightQueueFilters>(
		() => normalizeOnboardingOversightQueueFilters(search)
	);
	const { error, isLoading, isRefetching, queueRows } =
		useOnboardingOversightQueue(search);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "onboardingOversight.queue.errorBody",
		titleKey: "onboardingOversight.queue.errorTitle",
	});
	const language = i18n.resolvedLanguage ?? "en";

	useEffect(() => {
		setDraftFilters(normalizeOnboardingOversightQueueFilters(search));
	}, [search]);

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

	const handleSelectFilterInput = <
		Key extends
			| "environment"
			| "onboardingState"
			| "promotionStatus"
			| "recordType",
	>(
		key: Key
	): FormEventHandler<Element> => {
		return (event): void => {
			setDraftFilter(
				key,
				readInputValue(event.nativeEvent) as OnboardingOversightQueueFilters[Key]
			);
		};
	};

	const tableRows = useMemo<Array<QueueTableRow>>(
		() =>
			queueRows.map((row) => ({
				departmentName:
					row.departmentName ?? t("onboardingOversight.queue.notApplicable"),
				detailPath: row.detailPath,
				environment: getEnvironmentLabel(
					t,
					row.targetEnvironment ?? row.currentEnvironment
				),
				externalReviewReference:
					row.externalReviewReference ??
					t("onboardingOversight.queue.notApplicable"),
				lastActivityAt: formatDateTime(row.lastActivityAt, language),
				onboardingState: getWorkspaceOnboardingStateLabel(
					t,
					row.onboardingState
				),
				primaryRecordLabel: row.primaryRecordLabel,
				promotionStatus: row.promotionStatus
					? getWorkspacePromotionStatusLabel(t, row.promotionStatus)
					: t("onboardingOversight.queue.notApplicable"),
				recordType: getRecordTypeLabel(t, row.recordType),
				recordUuid: row.recordUuid,
				workspaceName: row.workspaceName,
			})),
		[language, queueRows, t]
	);

	const columns = useMemo<Array<DataTableColumn<QueueTableRow>>>(
		() => [
			{
				field: "recordType",
				headerName: t("onboardingOversight.queue.recordTypeColumn"),
			},
			{
				field: "primaryRecordLabel",
				headerName: t(
					"onboardingOversight.queue.primaryRecordLabelColumn"
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
				field: "onboardingState",
				headerName: t("onboardingOversight.queue.onboardingStateColumn"),
			},
			{
				field: "environment",
				headerName: t("onboardingOversight.queue.environmentColumn"),
			},
			{
				field: "promotionStatus",
				headerName: t("onboardingOversight.queue.promotionStatusColumn"),
			},
			{
				field: "externalReviewReference",
				headerName: t(
					"onboardingOversight.queue.externalReviewReferenceColumn"
				),
			},
			{
				field: "lastActivityAt",
				headerName: t("onboardingOversight.queue.lastActivityAtColumn"),
			},
		],
		[t]
	);

	const handleFilterSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		void navigate({
			to: "/onboarding-oversight/queue",
			search: normalizeOnboardingOversightQueueFilters(draftFilters),
		});
	};

	const handleClearFilters = (): void => {
		const clearedFilters = normalizeOnboardingOversightQueueFilters({});
		setDraftFilters(clearedFilters);
		void navigate({
			to: "/onboarding-oversight/queue",
			search: clearedFilters,
		});
	};

	return (
		<Grid columns="1fr" tag="div">
			<Heading tag="h1">{t("onboardingOversight.queue.pageTitle")}</Heading>
			<Text>{t("onboardingOversight.queue.summary")}</Text>
			<Notice
				noticeRole="info"
				noticeTitle={t("onboardingOversight.queue.accessNoticeTitle")}
				noticeTitleTag="h2"
			>
				<Text>{t("onboardingOversight.queue.accessNoticeBody")}</Text>
			</Notice>

			<form
				className="flex flex-col gap-300 rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300"
				onSubmit={handleFilterSubmit}
			>
				<Heading tag="h2">{t("onboardingOversight.queue.filtersTitle")}</Heading>
				<div className="grid gap-300 md:grid-cols-2 xl:grid-cols-3">
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
						label={t("onboardingOversight.queue.filtersRecordTypeLabel")}
						name="recordType"
						selectId="oversight-queue-record-type"
						value={draftFilters.recordType ?? ""}
						onInput={handleSelectFilterInput("recordType")}
					>
						<option value="">{t("onboardingOversight.queue.anyOption")}</option>
						{onboardingOversightQueueRecordTypes.map((value) => (
							<option key={value} value={value}>
								{getRecordTypeLabel(t, value)}
							</option>
						))}
					</Select>
					<Select
						label={t("onboardingOversight.queue.filtersOnboardingStateLabel")}
						name="onboardingState"
						selectId="oversight-queue-onboarding-state"
						value={draftFilters.onboardingState ?? ""}
						onInput={handleSelectFilterInput("onboardingState")}
					>
						<option value="">{t("onboardingOversight.queue.anyOption")}</option>
						{onboardingOversightQueueLifecycleStates.map((value) => (
							<option key={value} value={value}>
								{getWorkspaceOnboardingStateLabel(t, value)}
							</option>
						))}
					</Select>
					<Select
						label={t("onboardingOversight.queue.filtersEnvironmentLabel")}
						name="environment"
						selectId="oversight-queue-environment"
						value={draftFilters.environment ?? ""}
						onInput={handleSelectFilterInput("environment")}
					>
						<option value="">{t("onboardingOversight.queue.anyOption")}</option>
						{onboardingOversightQueueEnvironments.map((value) => (
							<option key={value} value={value}>
								{getEnvironmentLabel(t, value)}
							</option>
						))}
					</Select>
					<Select
						label={t("onboardingOversight.queue.filtersPromotionStatusLabel")}
						name="promotionStatus"
						selectId="oversight-queue-promotion-status"
						value={draftFilters.promotionStatus ?? ""}
						onInput={handleSelectFilterInput("promotionStatus")}
					>
						<option value="">{t("onboardingOversight.queue.anyOption")}</option>
						{onboardingOversightQueuePromotionStatuses.map((value) => (
							<option key={value} value={value}>
								{getWorkspacePromotionStatusLabel(t, value)}
							</option>
						))}
					</Select>
				</div>
				<div className="flex flex-wrap gap-200">
					<Button type="submit">
						{t("onboardingOversight.queue.applyAction")}
					</Button>
					<Button
						buttonRole="secondary"
						onGcdsClick={handleClearFilters}
						type="button"
					>
						{t("onboardingOversight.queue.clearAction")}
					</Button>
				</div>
			</form>

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
					noticeTitle={t(errorNotice.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey as never)}</Text>
				</Notice>
			) : null}

			{!isLoading && !isRefetching && !errorNotice && tableRows.length === 0 ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("onboardingOversight.queue.emptyTitle")}
					noticeTitleTag="h2"
				>
					<Text>
						{hasActiveFilters(search)
							? t("onboardingOversight.queue.emptyFilteredBody")
							: t("onboardingOversight.queue.emptyBody")}
					</Text>
				</Notice>
			) : null}

			{!errorNotice && tableRows.length > 0 ? (
				<DataTable
					action={{
						buttonLabel: t("onboardingOversight.queue.viewAction"),
						onAction: (row): void => {
							void navigate({ to: row.detailPath });
						},
						screenReaderLabel: (row): string => row.primaryRecordLabel,
					}}
					columns={columns}
					getRowId={(row): string => row.recordUuid}
					itemLabel={t("onboardingOversight.queue.tableTitle")}
					rows={tableRows}
					title={t("onboardingOversight.queue.tableTitle")}
				/>
			) : null}
		</Grid>
	);
};
