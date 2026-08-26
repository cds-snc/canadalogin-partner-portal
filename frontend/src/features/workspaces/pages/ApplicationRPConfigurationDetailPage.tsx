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
	getProductionReviewSummaryLabel,
	getRegistrationStatusLabel,
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
	const canWriteConfiguration = hasCapability(
		authorizationContext,
		"rp_configuration_write",
		workspaceUuid
	);
	const canViewProductionReview =
		canReadConfiguration ||
		hasCapability(
			authorizationContext,
			"production_review_request_write",
			workspaceUuid
		) ||
		hasCapability(authorizationContext, "production_review", workspaceUuid);
	const canViewProductionReviewTask =
		canViewProductionReview &&
		configuration?.canadaLoginEnvironment === "production";
	const hasFocusedTask =
		canReadConfiguration ||
		canReadUsage ||
		canManageCredentials ||
		canViewProductionReviewTask;
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
		configuration &&
		canWriteConfiguration &&
		!configuration.registrationCompletedAt &&
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
							<strong>{t("workspaces.registrationStatusLabel")}</strong>
						</dt>
						<dd>
							{getRegistrationStatusLabel(
								t as never,
								configuration.registrationCompletedAt
							)}
						</dd>
						{configuration.canadaLoginEnvironment === "production" ? (
							<>
								<dt>
									<strong>{t("workspaces.productionReviewLabel")}</strong>
								</dt>
								<dd>
									{getProductionReviewSummaryLabel(
										t as never,
										configuration.productionReviewStatus,
										configuration.productionReviewReconciliationRequired
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
							<div className="flex flex-wrap gap-200">
								<Button
									buttonRole="secondary"
									href={`${basePath}/copy`}
									type="link"
								>
									{t("workspaces.rpCopyTaskTitle")}
								</Button>
								<Button
									buttonRole="secondary"
									href={`${basePath}/settings`}
									type="link"
								>
									{t("workspaces.rpOverviewSettingsTitle")}
								</Button>
							</div>
						</section>
					) : null}

					<section className="grid gap-200">
						<Heading tag="h2">{t("workspaces.rpOverviewTasksTitle")}</Heading>
						{hasFocusedTask ? (
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
										href={`${basePath}/manage-credentials`}
										description={t(
											"workspaces.rpOverviewCredentialsDescription"
										)}
									/>
								) : null}
								{canViewProductionReviewTask ? (
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
						) : (
							<Text>{t("workspaces.rpOverviewNoPartnerActions")}</Text>
						)}
					</section>
				</>
			) : null}

			<div>
				<Link
					href={
						canReadConfiguration
							? `/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/rp-configurations`
							: `/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}`
					}
				>
					{t(
						canReadConfiguration
							? "workspaces.rpConfigurationsBackToList"
							: "workspaces.appInfoBackToApplication"
					)}
				</Link>
			</div>
		</div>
	);
};
