type Translate = (
	key: string | Array<string>,
	options?: Record<string, unknown>
) => string;

const formatTokenLabel = (value: string): string =>
	value.trim().replace(/_/g, " ").replace(/\s+/g, " ");

export const getCanadaLoginEnvironmentLabel = (
	t: Translate,
	environment: string
): string => {
	switch (environment.trim().toLowerCase()) {
		case "test":
			return t("workspaces.environmentTest");
		case "staging":
			return t("workspaces.environmentStaging");
		case "production":
			return t("workspaces.environmentProduction");
		default:
			return formatTokenLabel(environment);
	}
};

export const getRegistrationStatusLabel = (
	t: Translate,
	registrationCompletedAt: string | null | undefined
): string =>
	registrationCompletedAt
		? t("workspaces.registrationStatusComplete")
		: t("workspaces.registrationStatusIncomplete");

export const getProductionReviewStatusLabel = (
	t: Translate,
	status: string
): string => {
	switch (status.trim().toLowerCase()) {
		case "pending":
			return t("workspaces.productionReviewStatusPending");
		case "approved":
			return t("workspaces.productionReviewStatusApproved");
		case "rejected":
			return t("workspaces.productionReviewStatusRejected");
		default:
			return formatTokenLabel(status);
	}
};

export const getProductionReviewSummaryLabel = (
	t: Translate,
	status: string | null | undefined,
	reconciliationRequired = false
): string => {
	if (reconciliationRequired) {
		return t("workspaces.productionReviewReconciliationRequired");
	}
	return status
		? getProductionReviewStatusLabel(t, status)
		: t("workspaces.rpProductionReviewNotRequested");
};
