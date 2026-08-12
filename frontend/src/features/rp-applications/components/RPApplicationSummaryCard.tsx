import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Card, Link } from "@/components/ui";
import { ROLE_LABEL_KEYS } from "@/features/auth/authorization";
import type { RPApplicationSummaryRead } from "@/fetch/rp-applications";
import { getLocalizedRPApplicationName } from "../rp-application-summary";

const formatTokenLabel = (value: string): string =>
	value.trim().replace(/_/g, " ").replace(/\s+/g, " ");

const environmentLabelKey = (value: string): string | null => {
	switch (value.trim().toLowerCase()) {
		case "test":
			return "yourApplications.environmentTest";
		case "staging":
			return "yourApplications.environmentStaging";
		case "production":
			return "yourApplications.environmentProduction";
		default:
			return null;
	}
};

const onboardingLabelKey = (value: string): string | null => {
	switch (value.trim().toLowerCase()) {
		case "draft":
			return "yourApplications.onboardingStateDraft";
		case "submitted":
			return "yourApplications.onboardingStateSubmitted";
		case "under_review":
			return "yourApplications.onboardingStateUnderReview";
		case "approved":
			return "yourApplications.onboardingStateApproved";
		case "launched":
			return "yourApplications.onboardingStateLaunched";
		default:
			return null;
	}
};

const promotionLabelKey = (value: string): string | null => {
	switch (value.trim().toLowerCase()) {
		case "review_tracked":
			return "yourApplications.promotionStatusReviewTracked";
		case "changes_requested":
			return "yourApplications.promotionStatusChangesRequested";
		case "approved":
			return "yourApplications.promotionStatusApproved";
		case "launched":
			return "yourApplications.promotionStatusLaunched";
		default:
			return null;
	}
};

type RPApplicationSummaryCardProps = {
	application: RPApplicationSummaryRead;
	showWorkspaceContext?: boolean;
};

export const RPApplicationSummaryCard = ({
	application,
	showWorkspaceContext = false,
}: RPApplicationSummaryCardProps): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const segments: Array<string> = [];
	const environment = application.canadaLoginEnvironment?.trim();
	const onboardingState = application.onboardingState?.trim();
	const promotionStatus = application.promotionStatus?.trim();

	if (environment) {
		const key = environmentLabelKey(environment);
		segments.push(
			`${t("yourApplications.environmentLabel")}: ${key ? t(key as never) : formatTokenLabel(environment)}`
		);
	}
	if (onboardingState) {
		const key = onboardingLabelKey(onboardingState);
		segments.push(
			`${t("yourApplications.onboardingStateLabel")}: ${key ? t(key as never) : formatTokenLabel(onboardingState)}`
		);
	}
	if (promotionStatus) {
		const key = promotionLabelKey(promotionStatus);
		segments.push(
			`${t("yourApplications.productionReviewLabel")}: ${key ? t(key as never) : formatTokenLabel(promotionStatus)}`
		);
	}
	if (showWorkspaceContext) {
		segments.push(
			application.role
				? t("authorization.workspaceRoleNameContext", {
						role: t(ROLE_LABEL_KEYS[application.role] as never),
						workspaceName: application.workspaceName,
					})
				: application.workspaceName
		);
	}

	const name =
		getLocalizedRPApplicationName(
			application,
			i18n?.resolvedLanguage ?? i18n?.language ?? "en"
		) || t("yourApplications.unknownApplication");
	const description =
		segments.length > 0
			? segments.join(". ")
			: t("yourApplications.lifecycleUnavailable");

	return (
		<div className="grid gap-100">
			<Card
				cardTitle={name}
				cardTitleTag="h3"
				description={description}
				href={`/workspaces/${encodeURIComponent(application.workspaceUuid)}/applications/${encodeURIComponent(application.uuid)}`}
			/>
			{application.resumeTaskPath ? (
				<Link href={application.resumeTaskPath}>
					{t("yourApplications.resumeRegistration", { name })}
				</Link>
			) : null}
		</div>
	);
};
