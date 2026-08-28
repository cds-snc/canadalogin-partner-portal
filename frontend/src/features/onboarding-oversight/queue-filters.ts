export const onboardingOversightQueueReviewStatuses = [
	"pending",
	"approved",
	"rejected",
] as const;

export type OnboardingOversightQueueReviewStatus =
	(typeof onboardingOversightQueueReviewStatuses)[number];

export type OnboardingOversightQueueFilters = {
	department?: string;
	reviewStatus?: OnboardingOversightQueueReviewStatus;
	workspace?: string;
};

const reviewStatusSet = new Set<string>(onboardingOversightQueueReviewStatuses);

const normalizeText = (value: unknown): string | undefined => {
	if (typeof value !== "string") {
		return undefined;
	}

	const trimmedValue = value.trim();
	return trimmedValue === "" ? undefined : trimmedValue;
};

const normalizeReviewStatus = (
	value: unknown
): OnboardingOversightQueueReviewStatus | undefined => {
	const normalizedValue = normalizeText(value);
	if (!normalizedValue || !reviewStatusSet.has(normalizedValue)) {
		return undefined;
	}

	return normalizedValue as OnboardingOversightQueueReviewStatus;
};

export const normalizeOnboardingOversightQueueFilters = (
	filters: Record<string, unknown> | OnboardingOversightQueueFilters
): OnboardingOversightQueueFilters => {
	const values = filters as Record<string, unknown>;

	return {
		department: normalizeText(values["department"]),
		reviewStatus: normalizeReviewStatus(
			values["reviewStatus"] ?? values["review_status"]
		),
		workspace: normalizeText(values["workspace"]),
	};
};
