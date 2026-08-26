import { useQuery } from "@tanstack/react-query";
import {
	normalizeOnboardingOversightQueueFilters,
	type OnboardingOversightQueueFilters,
} from "../queue-filters";
import {
	getOnboardingOversightQueue,
	type OnboardingOversightQueueRowRead,
} from "@/fetch/onboarding-oversight";

export type OnboardingOversightQueueState = {
	error: Error | null;
	isLoading: boolean;
	isRefetching: boolean;
	queueRows: Array<OnboardingOversightQueueRowRead>;
};

export const onboardingOversightQueueQueryKey = (
	filters: OnboardingOversightQueueFilters
) =>
	[
		"onboarding-oversight",
		"production-reviews",
		normalizeOnboardingOversightQueueFilters(filters),
	] as const;

export const useOnboardingOversightQueue = (
	filters: OnboardingOversightQueueFilters
): OnboardingOversightQueueState => {
	const normalizedFilters = normalizeOnboardingOversightQueueFilters(filters);
	const query = useQuery<Array<OnboardingOversightQueueRowRead>, Error>({
		queryFn: () => getOnboardingOversightQueue(normalizedFilters),
		queryKey: onboardingOversightQueueQueryKey(normalizedFilters),
	});

	return {
		error: query.error ?? null,
		isLoading: query.isLoading,
		isRefetching: query.isRefetching,
		queueRows: query.data ?? [],
	};
};
