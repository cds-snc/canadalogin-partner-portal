import { requestJson } from "./request-json";
import {
	normalizeOnboardingOversightQueueFilters,
	type OnboardingOversightQueueFilters,
	type OnboardingOversightQueueReviewStatus,
} from "@/features/onboarding-oversight/queue-filters";

export type OnboardingOversightQueueRowRead = {
	applicationInformationUuid: string;
	applicationNameEn: string;
	applicationNameFr: string;
	configurationName: string;
	departmentName?: string | null;
	departmentUuid?: string | null;
	detailPath: string;
	decidedAt?: string | null;
	externalReviewReference: string;
	requestedAt: string;
	reviewedAt?: string | null;
	reviewedByTeam?: string | null;
	reviewedByUserUuid?: string | null;
	reviewStatus: OnboardingOversightQueueReviewStatus;
	rpConfigurationUuid: string;
	sourceRpConfigurationUuid?: string | null;
	updatedAt?: string | null;
	workspaceName: string;
	workspaceUuid: string;
};

const buildQueryString = (filters: OnboardingOversightQueueFilters): string => {
	const normalizedFilters = normalizeOnboardingOversightQueueFilters(filters);
	const params = new URLSearchParams();

	if (normalizedFilters.department) {
		params.set("department", normalizedFilters.department);
	}
	if (normalizedFilters.reviewStatus) {
		params.set("review_status", normalizedFilters.reviewStatus);
	}
	if (normalizedFilters.workspace) {
		params.set("workspace", normalizedFilters.workspace);
	}

	const queryString = params.toString();
	return queryString ? `?${queryString}` : "";
};

export const getOnboardingOversightQueue = async (
	filters: OnboardingOversightQueueFilters = {}
): Promise<Array<OnboardingOversightQueueRowRead>> => {
	const result =
		await requestJson<Array<OnboardingOversightQueueRowRead> | null>(
			`/api/v1/onboarding-oversight/production-reviews${buildQueryString(filters)}`,
			{
				cache: "no-store",
				method: "GET",
			}
		);

	return result ?? [];
};
