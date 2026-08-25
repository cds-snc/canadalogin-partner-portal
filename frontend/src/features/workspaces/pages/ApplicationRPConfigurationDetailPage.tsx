import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import {
	Button,
	Card,
	Grid,
	Heading,
	Link,
	Notice,
	Text,
} from "@/components/ui";
import { hasCapability } from "@/features/auth/authorization";
import { getRequestErrorNotice } from "@/fetch";
import { useSession } from "@/hooks";
import { useApplicationRPConfiguration } from "../hooks/use-application-rp-configurations";
import {
	getCanadaLoginEnvironmentLabel,
	getWorkspaceOnboardingStateLabel,
	getWorkspacePromotionStatusLabel,
} from "../onboarding-display";

export const ApplicationRPConfigurationDetailPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const { currentUser } = useSession();
	const { applicationInformationUuid, rpConfigurationUuid, workspaceUuid } =
		useParams({
			from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/$rpConfigurationUuid/",
		});
	const { configuration, error, isLoading } = useApplicationRPConfiguration(
		workspaceUuid,
		applicationInformationUuid,
		rpConfigurationUuid
	);
	const authorizationContext = currentUser?.authorizationContext;
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
	const canReadAudit = hasCapability(
		authorizationContext,
		"partner_audit_read",
		workspaceUuid
	);
	const canWriteConfiguration = hasCapability(
		authorizationContext,
		"rp_configuration_write",
		workspaceUuid
	);
	const canManageProductionReview =
		hasCapability(
			authorizationContext,
			"promotion_request_write",
			workspaceUuid
		) ||
		hasCapability(authorizationContext, "production_review", workspaceUuid);
	const applicationName = configuration
		? i18n.resolvedLanguage?.startsWith("fr")
			? configuration.serviceNameFr
			: configuration.serviceNameEn
		: null;
	const configurationName =
		configuration?.configurationName?.trim() ||
		t("workspaces.rpConfigurationTitle");
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "workspaces.rpConfigurationErrorBody",
		titleKey: "workspaces.rpConfigurationErrorTitle",
	});
	const basePath = `/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/rp-configurations/${rpConfigurationUuid}`;
	const resumeSetupHref =
		canWriteConfiguration &&
		configuration?.onboardingState === "draft" &&
		configuration.resumeTaskPath?.trim()
			? configuration.resumeTaskPath
			: null;
	return (
		<div className="grid gap-400">
			<div>
				<Heading tag="h1">{configurationName}</Heading>
				<Text>{t("workspaces.rpOverviewSummary")}</Text>
			</div>

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

			{configuration ? (
				<>
					<Grid columns="1fr" columnsDesktop="16rem 1fr" tag="dl">
						<dt>
							<strong>
								{t("workspaces.rpConfigurationsApplicationLabel")}
							</strong>
						</dt>
						<dd>{applicationName}</dd>
						<dt>
							<strong>
								{t("workspaces.applicationsPartnerEnvironmentLabel")}
							</strong>
						</dt>
						<dd>
							{configuration.partnerEnvironment?.trim() ||
								t("common.notProvided")}
							{canWriteConfiguration ? (
								<>
									{" "}
									<Link href={`${basePath}/partner-environment/edit`}>
										{t("workspaces.rpPartnerEnvironmentEditAction")}
									</Link>
								</>
							) : null}
						</dd>
						<dt>
							<strong>{t("yourApplications.environmentLabel")}</strong>
						</dt>
						<dd>
							{configuration.canadaLoginEnvironment?.trim()
								? getCanadaLoginEnvironmentLabel(
										t as never,
										configuration.canadaLoginEnvironment
									)
								: t("common.notAvailable")}
						</dd>
						<dt>
							<strong>{t("workspaces.onboardingStateLabel")}</strong>
						</dt>
						<dd>
							{configuration.onboardingState?.trim()
								? getWorkspaceOnboardingStateLabel(
										t as never,
										configuration.onboardingState
									)
								: t("common.notAvailable")}
						</dd>
						{configuration.promotionStatus?.trim() ? (
							<>
								<dt>
									<strong>{t("workspaces.productionReviewLabel")}</strong>
								</dt>
								<dd>
									{getWorkspacePromotionStatusLabel(
										t as never,
										configuration.promotionStatus
									)}
								</dd>
							</>
						) : null}
					</Grid>

					{resumeSetupHref ? (
						<div>
							<Button href={resumeSetupHref} type="link">
								{t("workspaces.rpConfigurationResumeSetupAction")}
							</Button>
						</div>
					) : null}

					{canWriteConfiguration ? (
						<section className="grid gap-100">
							<Heading tag="h2">
								{t("workspaces.rpLifecycleActionsTitle")}
							</Heading>
							<Text>{t("workspaces.rpCopyTaskDescription")}</Text>
							<div>
								<Button
									buttonRole="secondary"
									href={`${basePath}/copy`}
									type="link"
								>
									{t("workspaces.rpCopyTaskTitle")}
								</Button>
							</div>
						</section>
					) : null}

					<section className="grid gap-200">
						<Heading tag="h2">{t("workspaces.rpOverviewTasksTitle")}</Heading>
						<Grid columns="1fr" columnsDesktop="repeat(3, 1fr)">
							{canReadConfiguration ? (
								<Card
									cardTitle={t("workspaces.rpOverviewConfigurationTitle")}
									cardTitleTag="h3"
									href={`${basePath}/configuration`}
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
									href={`${basePath}/usage`}
								/>
							) : null}
							{canManageCredentials ? (
								<Card
									cardTitle={t("workspaces.rpOverviewCredentialsTitle")}
									cardTitleTag="h3"
									description={t("workspaces.rpOverviewCredentialsDescription")}
									href={`${basePath}/manage-credentials`}
								/>
							) : null}
							{canReadAudit ? (
								<Card
									cardTitle={t("workspaces.applicationsAuditAction")}
									cardTitleTag="h3"
									description={t("workspaces.applicationsAuditSummary")}
									href={`${basePath}/audit`}
								/>
							) : null}
							{canWriteConfiguration ? (
								<Card
									cardTitle={t("workspaces.rpOverviewSettingsTitle")}
									cardTitleTag="h3"
									description={t("workspaces.rpOverviewSettingsDescription")}
									href={`${basePath}/settings`}
								/>
							) : null}
							{canManageProductionReview &&
							configuration.canadaLoginEnvironment === "production" ? (
								<Card
									cardTitle={t("workspaces.rpProductionReviewTaskTitle")}
									cardTitleTag="h3"
									href={`${basePath}/production-review`}
									description={t(
										"workspaces.rpProductionReviewTaskDescription"
									)}
								/>
							) : null}
						</Grid>
					</section>
				</>
			) : null}

			<div>
				<Link
					href={`/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/rp-configurations`}
				>
					{t("workspaces.rpConfigurationsBackToList")}
				</Link>
			</div>
		</div>
	);
};
