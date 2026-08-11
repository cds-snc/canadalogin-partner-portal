export const onboardingOversightQueueRecordTypes = [
	"workspace",
	"application_information",
	"rp_application",
	"production_progression",
] as const;

export const onboardingOversightQueueLifecycleStates = [
	"submitted",
	"under_review",
	"approved",
	"launched",
] as const;

export const onboardingOversightQueueEnvironments = [
	"test",
	"staging",
	"production",
] as const;

export const onboardingOversightQueuePromotionStatuses = [
	"review_tracked",
	"changes_requested",
	"approved",
	"launched",
] as const;

export type OnboardingOversightQueueRecordType =
	(typeof onboardingOversightQueueRecordTypes)[number];

export type OnboardingOversightQueueLifecycleState =
	(typeof onboardingOversightQueueLifecycleStates)[number];

export type OnboardingOversightQueueEnvironment =
	(typeof onboardingOversightQueueEnvironments)[number];

export type OnboardingOversightQueuePromotionStatus =
	(typeof onboardingOversightQueuePromotionStatuses)[number];

export type OnboardingOversightQueueFilters = {
	department?: string;
	environment?: OnboardingOversightQueueEnvironment;
	onboardingState?: OnboardingOversightQueueLifecycleState;
	promotionStatus?: OnboardingOversightQueuePromotionStatus;
	recordType?: OnboardingOversightQueueRecordType;
	workspace?: string;
};

const recordTypeSet = new Set<string>(onboardingOversightQueueRecordTypes);
const onboardingStateSet = new Set<string>(
	onboardingOversightQueueLifecycleStates
);
const environmentSet = new Set<string>(onboardingOversightQueueEnvironments);
const promotionStatusSet = new Set<string>(
	onboardingOversightQueuePromotionStatuses
);

const normalizeText = (value: unknown): string | undefined => {
	if (typeof value !== "string") {
		return undefined;
	}

	const trimmedValue = value.trim();
	return trimmedValue === "" ? undefined : trimmedValue;
};

const normalizeEnum = <T extends string>(
	value: unknown,
	allowedValues: ReadonlySet<string>
): T | undefined => {
	const normalizedValue = normalizeText(value);
	if (!normalizedValue || !allowedValues.has(normalizedValue)) {
		return undefined;
	}

	return normalizedValue as T;
};

export const normalizeOnboardingOversightQueueFilters = (
	filters: Record<string, unknown> | OnboardingOversightQueueFilters
): OnboardingOversightQueueFilters => {
	const values = filters as Record<string, unknown>;

	return {
		department: normalizeText(values["department"]),
		environment: normalizeEnum<OnboardingOversightQueueEnvironment>(
			values["environment"],
			environmentSet
		),
		onboardingState: normalizeEnum<OnboardingOversightQueueLifecycleState>(
			values["onboardingState"] ?? values["onboarding_state"],
			onboardingStateSet
		),
		promotionStatus: normalizeEnum<OnboardingOversightQueuePromotionStatus>(
			values["promotionStatus"] ?? values["promotion_status"],
			promotionStatusSet
		),
		recordType: normalizeEnum<OnboardingOversightQueueRecordType>(
			values["recordType"] ?? values["record_type"],
			recordTypeSet
		),
		workspace: normalizeText(values["workspace"]),
	};
};
