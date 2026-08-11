import { useQuery } from "@tanstack/react-query";
import {
	normalizeOnboardingOversightReportFilters,
	type OnboardingOversightReportFilters,
} from "../report-filters";
import {
	getOnboardingOversightReport,
	type OnboardingOversightReportRead,
} from "@/fetch/onboarding-oversight";

export type OnboardingOversightReportState = {
	error: Error | null;
	isLoading: boolean;
	isRefetching: boolean;
	report: OnboardingOversightReportRead | null;
};

export const onboardingOversightReportQueryKey = (
	filters: OnboardingOversightReportFilters
) =>
	[
		"onboarding-oversight",
		"report",
		normalizeOnboardingOversightReportFilters(filters),
	] as const;

export const useOnboardingOversightReport = (
	filters: OnboardingOversightReportFilters
): OnboardingOversightReportState => {
	const normalizedFilters = normalizeOnboardingOversightReportFilters(filters);
	const query = useQuery<OnboardingOversightReportRead | null, Error>({
		queryFn: () => getOnboardingOversightReport(normalizedFilters),
		queryKey: onboardingOversightReportQueryKey(normalizedFilters),
	});

	return {
		error: query.error ?? null,
		isLoading: query.isLoading,
		isRefetching: query.isRefetching,
		report: query.data ?? null,
	};
};