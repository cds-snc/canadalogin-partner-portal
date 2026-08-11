type Translate = (
	key: string | Array<string>,
	options?: Record<string, unknown>
) => string;

const formatTokenLabel = (value: string): string =>
	value
		.trim()
		.replace(/_/g, " ")
		.replace(/\s+/g, " ");

export const getWorkspaceOnboardingStateLabel = (
	t: Translate,
	state: string
): string => {
	switch (state.trim().toLowerCase()) {
		case "draft":
			return t("workspaces.onboardingStateDraft");
		case "submitted":
			return t("workspaces.onboardingStateSubmitted");
		case "under_review":
			return t("workspaces.onboardingStateUnderReview");
		case "approved":
			return t("workspaces.onboardingStateApproved");
		case "launched":
			return t("workspaces.onboardingStateLaunched");
		default:
			return formatTokenLabel(state);
	}
};

export const getWorkspacePromotionStatusLabel = (
	t: Translate,
	status: string
): string => {
	switch (status.trim().toLowerCase()) {
		case "review_tracked":
			return t("workspaces.promotionStatusReviewTracked");
		case "changes_requested":
			return t("workspaces.promotionStatusChangesRequested");
		case "approved":
			return t("workspaces.promotionStatusApproved");
		case "launched":
			return t("workspaces.promotionStatusLaunched");
		default:
			return formatTokenLabel(status);
	}
};