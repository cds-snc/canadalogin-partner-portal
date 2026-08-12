import { buildApiUrl } from "./base-url";
import { requestJson } from "./request-json";
import {
	normalizeOnboardingOversightQueueFilters,
	type OnboardingOversightQueueEnvironment,
	type OnboardingOversightQueueFilters,
	type OnboardingOversightQueueLifecycleState,
	type OnboardingOversightQueuePromotionStatus,
	type OnboardingOversightQueueRecordType,
} from "@/features/onboarding-oversight/queue-filters";
import {
	normalizeOnboardingOversightReportFilters,
	type OnboardingOversightReportFilters,
	type OnboardingOversightReportGroupBy,
	type OnboardingOversightReportMetric,
} from "@/features/onboarding-oversight/report-filters";

export type OnboardingOversightQueueRowRead = {
	currentEnvironment?: OnboardingOversightQueueEnvironment | null;
	departmentName?: string | null;
	departmentUuid?: string | null;
	detailPath: string;
	externalReviewReference?: string | null;
	lastActivityAt?: string | null;
	onboardingState: OnboardingOversightQueueLifecycleState;
	primaryRecordLabel: string;
	promotionStatus?: OnboardingOversightQueuePromotionStatus | null;
	recordType: OnboardingOversightQueueRecordType;
	recordUuid: string;
	targetEnvironment?: OnboardingOversightQueueEnvironment | null;
	workspaceName: string;
	workspaceUuid: string;
};

export type OnboardingOversightReportAppliedFiltersRead = {
	endDate: string;
	groupBy?: OnboardingOversightReportGroupBy | null;
	metric: OnboardingOversightReportMetric;
	policyWindowDays?: number | null;
	startDate: string;
};

export type OnboardingOversightReportSummaryRead = {
	approvedCount?: number | null;
	compliantRpApplications?: number | null;
	conversionRate?: number | null;
	hygieneRate?: number | null;
	invitationsAccepted?: number | null;
	invitationsSent?: number | null;
	launchedCount?: number | null;
	nonCompliantRpApplications?: number | null;
	policyWindowDays?: number | null;
	submittedCount?: number | null;
	totalRpApplications?: number | null;
};

export type OnboardingOversightReportRowRead = {
	approvedCount?: number | null;
	bucketEnd?: string | null;
	bucketLabel: string;
	bucketStart?: string | null;
	compliantRpApplications?: number | null;
	conversionRate?: number | null;
	hygieneRate?: number | null;
	invitationsAccepted?: number | null;
	invitationsSent?: number | null;
	launchedCount?: number | null;
	nonCompliantRpApplications?: number | null;
	submittedCount?: number | null;
	totalRpApplications?: number | null;
};

export type OnboardingOversightReportRead = {
	appliedFilters: OnboardingOversightReportAppliedFiltersRead;
	exportAvailable: boolean;
	generatedAt: string;
	metric: OnboardingOversightReportMetric;
	rows: Array<OnboardingOversightReportRowRead>;
	summary: OnboardingOversightReportSummaryRead;
	title: string;
};

const buildQueryString = (filters: OnboardingOversightQueueFilters): string => {
	const normalizedFilters = normalizeOnboardingOversightQueueFilters(filters);
	const params = new URLSearchParams();

	if (normalizedFilters.department) {
		params.set("department", normalizedFilters.department);
	}
	if (normalizedFilters.environment) {
		params.set("environment", normalizedFilters.environment);
	}
	if (normalizedFilters.onboardingState) {
		params.set("onboarding_state", normalizedFilters.onboardingState);
	}
	if (normalizedFilters.promotionStatus) {
		params.set("promotion_status", normalizedFilters.promotionStatus);
	}
	if (normalizedFilters.recordType) {
		params.set("record_type", normalizedFilters.recordType);
	}
	if (normalizedFilters.workspace) {
		params.set("workspace", normalizedFilters.workspace);
	}

	const queryString = params.toString();
	return queryString ? `?${queryString}` : "";
};

const buildReportQueryString = (
	filters: OnboardingOversightReportFilters
): string => {
	const normalizedFilters = normalizeOnboardingOversightReportFilters(filters);
	const params = new URLSearchParams();

	params.set("metric", normalizedFilters.metric);
	params.set("start_date", normalizedFilters.startDate);
	params.set("end_date", normalizedFilters.endDate);
	if (normalizedFilters.groupBy) {
		params.set("group_by", normalizedFilters.groupBy);
	}

	return `?${params.toString()}`;
};

export const getOnboardingOversightQueue = async (
	filters: OnboardingOversightQueueFilters = {}
): Promise<Array<OnboardingOversightQueueRowRead>> => {
	const result =
		await requestJson<Array<OnboardingOversightQueueRowRead> | null>(
			`/api/v1/onboarding-oversight/queue${buildQueryString(filters)}`,
			{
				cache: "no-store",
				method: "GET",
			}
		);

	return result ?? [];
};

export const getOnboardingOversightReport = async (
	filters: OnboardingOversightReportFilters
): Promise<OnboardingOversightReportRead | null> =>
	requestJson<OnboardingOversightReportRead | null>(
		`/api/v1/onboarding-oversight/reports${buildReportQueryString(filters)}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);

export const getOnboardingOversightReportExportUrl = (
	filters: OnboardingOversightReportFilters
): string =>
	buildApiUrl(
		`/api/v1/onboarding-oversight/reports/export${buildReportQueryString(filters)}`
	);

export const getWorkspaceReport = async (
	workspaceUuid: string,
	filters: OnboardingOversightReportFilters
): Promise<OnboardingOversightReportRead | null> =>
	requestJson<OnboardingOversightReportRead | null>(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/reports${buildReportQueryString(filters)}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);

export const getWorkspaceReportExportUrl = (
	workspaceUuid: string,
	filters: OnboardingOversightReportFilters
): string =>
	buildApiUrl(
		`/api/v1/workspaces/${encodeURIComponent(workspaceUuid)}/reports/export${buildReportQueryString(filters)}`
	);
