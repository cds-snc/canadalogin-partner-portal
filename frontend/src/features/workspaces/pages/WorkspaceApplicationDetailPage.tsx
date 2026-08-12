import { useParams, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { Card, Grid, Heading, Notice, Text } from "@/components/ui";
import {
	getEffectiveRoleForWorkspace,
	hasCapability,
	ROLE_LABEL_KEYS,
} from "@/features/auth/authorization";
import { getRequestErrorNotice } from "@/fetch";
import { getLocalizedRPApplicationName } from "@/features/rp-applications/rp-application-summary";
import { useSession } from "@/hooks";
import { useWorkspace } from "../hooks/use-workspace";
import { useWorkspaceRPApplications } from "../hooks/use-workspace-rp-applications";
import {
	getCanadaLoginEnvironmentLabel,
	getWorkspaceOnboardingStateLabel,
	getWorkspacePromotionStatusLabel,
} from "../onboarding-display";

export const WorkspaceApplicationDetailPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const { currentUser } = useSession();
	const { rpApplicationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid",
	});
	const search = useSearch({
		from: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid",
	});
	const { applications, error, isLoading } =
		useWorkspaceRPApplications(workspaceUuid);
	const application =
		applications.find((candidate) => candidate.uuid === rpApplicationUuid) ??
		null;
	const { workspace } = useWorkspace(workspaceUuid);
	const authorizationContext = currentUser?.authorizationContext;
	const effectiveRole = getEffectiveRoleForWorkspace(
		authorizationContext,
		workspaceUuid
	);
	const canReadConfiguration = hasCapability(
		authorizationContext,
		"rp_configuration_read",
		workspaceUuid
	);
	const canReadUsage = hasCapability(
		authorizationContext,
		"mau_report_read",
		workspaceUuid
	);
	const canManageCredentials =
		hasCapability(authorizationContext, "partner_secret_read", workspaceUuid) &&
		hasCapability(
			authorizationContext,
			"partner_secret_lifecycle",
			workspaceUuid
		);
	const applicationName = application
		? getLocalizedRPApplicationName(
				application,
				i18n?.resolvedLanguage ?? i18n?.language ?? "en"
			) || t("workspaces.applicationsSectionTitle")
		: t("workspaces.applicationsSectionTitle");
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "workspaces.applicationsErrorBody",
		titleKey: "workspaces.applicationsErrorTitle",
	});
	const successMessage =
		search.created === "1"
			? t("workspaces.applicationsCreatedSuccess")
			: search.updated === "1"
				? t("workspaces.applicationsUpdatedSuccess")
				: null;

	useDocumentTitle(applicationName, t("home.title"));

	return (
		<div className="grid gap-400">
			<div>
				<Heading tag="h1">{applicationName}</Heading>
				<Text>{t("workspaces.rpOverviewSummary")}</Text>
				{application ? (
					<Text>
						{t("workspaces.rpOverviewContext", {
							environment: application.canadaLoginEnvironment?.trim()
								? getCanadaLoginEnvironmentLabel(
										t as never,
										application.canadaLoginEnvironment
									)
								: t("common.notAvailable"),
							status: application.onboardingState?.trim()
								? getWorkspaceOnboardingStateLabel(
										t as never,
										application.onboardingState
									)
								: t("common.notAvailable"),
						})}
					</Text>
				) : null}
				{application?.promotionStatus?.trim() ? (
					<Text>
						{t("workspaces.rpOverviewPromotionContext", {
							status: getWorkspacePromotionStatusLabel(
								t as never,
								application.promotionStatus
							),
						})}
					</Text>
				) : null}
				{effectiveRole && workspace ? (
					<Text>
						{t("authorization.activeWorkspaceNameContext", {
							role: t(ROLE_LABEL_KEYS[effectiveRole] as never),
							workspaceName: workspace.name,
						})}
					</Text>
				) : null}
			</div>

			{successMessage ? (
				<Notice
					noticeRole="success"
					noticeTitle={successMessage}
					noticeTitleTag="h2"
				>
					<Text>{successMessage}</Text>
				</Notice>
			) : null}

			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("workspaces.applicationsLoadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.applicationsLoadingBody")}</Text>
				</Notice>
			) : null}

			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey as never)}</Text>
				</Notice>
			) : null}

			{!isLoading && !errorNotice && !application ? (
				<Notice
					noticeRole="warning"
					noticeTitle={t("workspaces.rpOverviewNotFoundTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.rpOverviewNotFoundBody")}</Text>
				</Notice>
			) : null}

			{application ? (
				canReadConfiguration || canReadUsage || canManageCredentials ? (
					<section className="grid gap-200">
						<Heading tag="h2">{t("workspaces.rpOverviewTasksTitle")}</Heading>
						<Grid columns="1fr" columnsDesktop="repeat(3, 1fr)">
							{canReadConfiguration ? (
								<Card
									cardTitle={t("workspaces.rpOverviewConfigurationTitle")}
									cardTitleTag="h3"
									href={`/workspaces/${workspaceUuid}/applications/${rpApplicationUuid}/configuration`}
									description={t(
										"workspaces.rpOverviewConfigurationDescription"
									)}
								/>
							) : null}
							{canReadUsage ? (
								<Card
									cardTitle={t("workspaces.rpOverviewUsageTitle")}
									cardTitleTag="h3"
									description={t("workspaces.rpOverviewUsageDescription")}
									href={`/workspaces/${workspaceUuid}/applications/${rpApplicationUuid}/usage`}
								/>
							) : null}
							{canManageCredentials ? (
								<Card
									cardTitle={t("workspaces.rpOverviewCredentialsTitle")}
									cardTitleTag="h3"
									href={`/workspaces/${workspaceUuid}/applications/${rpApplicationUuid}/manage-credentials`}
									description={t(
										"workspaces.rpOverviewCredentialsDescription"
									)}
								/>
							) : null}
						</Grid>
					</section>
				) : (
					<Notice
						noticeRole="info"
						noticeTitle={t("workspaces.rpOverviewNoActionsTitle")}
						noticeTitleTag="h2"
					>
						<Text>{t("workspaces.rpOverviewNoActionsBody")}</Text>
					</Notice>
				)
			) : null}
		</div>
	);
};
