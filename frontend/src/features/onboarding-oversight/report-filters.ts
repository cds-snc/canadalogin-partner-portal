export const onboardingOversightReportMetrics = [
	"onboarding_throughput",
	"invitation_conversion",
	"secret_rotation_hygiene",
] as const;

export const onboardingOversightReportGroupByOptions = [
	"day",
	"week",
	"month",
] as const;

export type OnboardingOversightReportMetric =
	(typeof onboardingOversightReportMetrics)[number];

export type OnboardingOversightReportGroupBy =
	(typeof onboardingOversightReportGroupByOptions)[number];

export type OnboardingOversightReportFilters = {
	endDate: string;
	groupBy?: OnboardingOversightReportGroupBy;
	metric: OnboardingOversightReportMetric;
	startDate: string;
};

const reportMetricSet = new Set<string>(onboardingOversightReportMetrics);
const reportGroupBySet = new Set<string>(
	onboardingOversightReportGroupByOptions
);

const normalizeText = (value: unknown): string | undefined => {
	if (typeof value !== "string") {
		return undefined;
	}

	const trimmedValue = value.trim();
	return trimmedValue === "" ? undefined : trimmedValue;
};

const isReportMetric = (
	value: string | undefined
): value is OnboardingOversightReportMetric =>
	typeof value === "string" && reportMetricSet.has(value);

const isReportGroupBy = (
	value: string | undefined
): value is OnboardingOversightReportGroupBy =>
	typeof value === "string" && reportGroupBySet.has(value);

const formatDayForInput = (value: Date): string => {
	const year = value.getFullYear();
	const month = String(value.getMonth() + 1).padStart(2, "0");
	const day = String(value.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const buildDefaultDateRange = (): { endDate: string; startDate: string } => {
	const now = new Date();
	const start = new Date(now);
	start.setDate(start.getDate() - 30);

	return {
		endDate: formatDayForInput(now),
		startDate: formatDayForInput(start),
	};
};

export const supportsOnboardingOversightGrouping = (
	metric: OnboardingOversightReportMetric
): boolean => metric !== "secret_rotation_hygiene";

export const normalizeOnboardingOversightReportFilters = (
	filters: Record<string, unknown> | Partial<OnboardingOversightReportFilters>
): OnboardingOversightReportFilters => {
	const values = filters as Record<string, unknown>;
	const defaultDateRange = buildDefaultDateRange();
	const metricValue = normalizeText(values["metric"]);
	const metric = isReportMetric(metricValue)
		? metricValue
		: "onboarding_throughput";
	const groupByValue = normalizeText(values["groupBy"] ?? values["group_by"]);
	const groupBy = supportsOnboardingOversightGrouping(metric)
		? isReportGroupBy(groupByValue)
			? groupByValue
			: "week"
		: undefined;

	return {
		endDate:
			normalizeText(values["endDate"] ?? values["end_date"]) ??
			defaultDateRange.endDate,
		...(groupBy ? { groupBy } : {}),
		metric,
		startDate:
			normalizeText(values["startDate"] ?? values["start_date"]) ??
			defaultDateRange.startDate,
	};
};