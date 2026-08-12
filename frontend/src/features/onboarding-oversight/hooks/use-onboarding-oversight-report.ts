import { useQuery } from "@tanstack/react-query";
import {
	normalizeOnboardingOversightReportFilters,
	type OnboardingOversightReportFilters,
} from "../report-filters";
import {
	getOnboardingOversightReport,
	getWorkspaceReport,
	type OnboardingOversightReportRead,
} from "@/fetch/onboarding-oversight";

export type OnboardingOversightReportState = {
	error: Error | null;
	isLoading: boolean;
	isRefetching: boolean;
	refetch: () => Promise<unknown>;
	report: OnboardingOversightReportRead | null;
};

export const onboardingOversightReportQueryKey = (
	filters: OnboardingOversightReportFilters,
	workspaceUuid?: string
) =>
	[
		workspaceUuid ? "workspace" : "onboarding-oversight",
		...(workspaceUuid ? [workspaceUuid] : []),
		"report",
		normalizeOnboardingOversightReportFilters(filters),
	] as const;

export const useOnboardingOversightReport = (
	filters: OnboardingOversightReportFilters,
	workspaceUuid?: string
): OnboardingOversightReportState => {
	const normalizedFilters = normalizeOnboardingOversightReportFilters(filters);
	const query = useQuery<OnboardingOversightReportRead | null, Error>({
		queryFn: () =>
			workspaceUuid
				? getWorkspaceReport(workspaceUuid, normalizedFilters)
				: getOnboardingOversightReport(normalizedFilters),
		queryKey: onboardingOversightReportQueryKey(
			normalizedFilters,
			workspaceUuid
		),
	});

	return {
		error: query.error ?? null,
		isLoading: query.isLoading,
		isRefetching: query.isRefetching,
		refetch: () => query.refetch(),
		report: query.data ?? null,
	};
};
