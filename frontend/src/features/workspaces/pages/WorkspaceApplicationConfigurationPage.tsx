import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { Button, Grid, Heading, Link, Notice, Text } from "@/components/ui";
import { hasCapability } from "@/features/auth/authorization";
import { getLocalizedRPApplicationName } from "@/features/rp-applications/rp-application-summary";
import { getRequestErrorNotice } from "@/fetch";
import type { WorkspaceRPApplicationRegistrationAnswers } from "@/fetch/rp-applications";
import { useSession } from "@/hooks";
import { useApplicationRPConfigurationConfiguration } from "../hooks/use-application-rp-configurations";
import {
	getCanadaLoginEnvironmentLabel,
	getWorkspaceOnboardingStateLabel,
	getWorkspacePromotionStatusLabel,
} from "../onboarding-display";
import { getEarliestIncompleteRegistrationStep } from "../workspace-rp-registration-flow";

type AnswerKey = keyof WorkspaceRPApplicationRegistrationAnswers;

const configurationGroups: ReadonlyArray<{
	fields: ReadonlyArray<AnswerKey>;
	titleKey: string;
}> = [
	{
		fields: ["serviceNameEn", "serviceNameFr"],
		titleKey: "workspaces.applicationsBasicsLegend",
	},
	{
		fields: [
			"applicationEnvironmentUrlEn",
			"applicationEnvironmentUrlFr",
			"redirectUris",
			"postLogoutRedirectUris",
			"logoutMode",
			"logoutUri",
		],
		titleKey: "workspaces.registration.steps.endpoints",
	},
	{
		fields: [
			"clientType",
			"supportsAuthorizationCodeFlow",
			"clientAuthMethod",
			"privateKeyDistributionMethod",
			"jwksUri",
			"requestedScopes",
			"sectorIdentifier",
			"sharesPairwiseIdentifiers",
			"migrationSectorIdentifierUrl",
			"pkceSupported",
			"pkceAlgorithms",
			"pkceOtherAlgorithm",
		],
		titleKey: "workspaces.applicationsClientLegend",
	},
	{
		fields: [
			"requestSigningSupported",
			"requestSigningTargets",
			"requestSigningAlgorithms",
			"requestSigningOtherAlgorithm",
			"requestSigningRoadmap",
			"requestSigningRevisitOn",
			"signatureValidationSupported",
			"signatureValidationTargets",
			"signatureValidationAlgorithms",
			"signatureValidationOtherAlgorithm",
			"signatureValidationRoadmap",
			"signatureValidationRevisitOn",
		],
		titleKey: "workspaces.applicationsSigningLegend",
	},
	{
		fields: [
			"requestEncryptionSupported",
			"requestEncryptionTargets",
			"requestEncryptionKeyManagementAlgorithms",
			"requestEncryptionOtherKeyManagementAlgorithm",
			"requestEncryptionContentAlgorithms",
			"requestEncryptionOtherContentAlgorithm",
			"requestEncryptionRoadmap",
			"requestEncryptionRevisitOn",
			"messageDecryptionSupported",
			"messageDecryptionTargets",
			"messageDecryptionKeyManagementAlgorithms",
			"messageDecryptionOtherKeyManagementAlgorithm",
			"messageDecryptionContentAlgorithms",
			"messageDecryptionOtherContentAlgorithm",
			"messageDecryptionRoadmap",
			"messageDecryptionRevisitOn",
		],
		titleKey: "workspaces.applicationsEncryptionLegend",
	},
];

const fieldLabelKeys: Partial<Record<AnswerKey, string>> = {
	applicationEnvironmentUrlEn: "workspaces.applicationsUrlEnLabel",
	applicationEnvironmentUrlFr: "workspaces.applicationsUrlFrLabel",
	canadaLoginEnvironment: "workspaces.applicationsEnvironmentLabel",
	clientAuthMethod: "workspaces.applicationsClientAuthMethodLabel",
	clientType: "workspaces.applicationsClientTypeLabel",
	logoutMode: "workspaces.applicationsLogoutModeLabel",
	logoutUri: "workspaces.applicationsLogoutUriLabel",
	messageDecryptionContentAlgorithms:
		"workspaces.applicationsContentEncryptionAlgorithmsLabel",
	messageDecryptionKeyManagementAlgorithms:
		"workspaces.applicationsKeyManagementAlgorithmsLabel",
	messageDecryptionOtherContentAlgorithm:
		"workspaces.applicationsOtherContentAlgorithmLabel",
	messageDecryptionOtherKeyManagementAlgorithm:
		"workspaces.applicationsOtherKeyManagementAlgorithmLabel",
	messageDecryptionRevisitOn: "workspaces.applicationsRevisitOnLabel",
	messageDecryptionRoadmap: "workspaces.applicationsRoadmapLabel",
	messageDecryptionSupported:
		"workspaces.applicationsMessageDecryptionSupportedLabel",
	messageDecryptionTargets:
		"workspaces.applicationsMessageDecryptionTargetsLabel",
	migrationSectorIdentifierUrl:
		"workspaces.applicationsMigrationSectorIdentifierUrlLabel",
	pkceAlgorithms: "workspaces.applicationsPkceAlgorithmsLabel",
	pkceOtherAlgorithm: "workspaces.applicationsPkceOtherAlgorithmLabel",
	pkceSupported: "workspaces.applicationsPkceSupportedLabel",
	postLogoutRedirectUris: "workspaces.applicationsPostLogoutRedirectUrisLabel",
	privateKeyDistributionMethod:
		"workspaces.applicationsPrivateKeyDistributionLabel",
	redirectUris: "workspaces.applicationsRedirectUrisLabel",
	requestEncryptionContentAlgorithms:
		"workspaces.applicationsContentEncryptionAlgorithmsLabel",
	requestEncryptionKeyManagementAlgorithms:
		"workspaces.applicationsKeyManagementAlgorithmsLabel",
	requestEncryptionOtherContentAlgorithm:
		"workspaces.applicationsOtherContentAlgorithmLabel",
	requestEncryptionOtherKeyManagementAlgorithm:
		"workspaces.applicationsOtherKeyManagementAlgorithmLabel",
	requestEncryptionRevisitOn: "workspaces.applicationsRevisitOnLabel",
	requestEncryptionRoadmap: "workspaces.applicationsRoadmapLabel",
	requestEncryptionSupported:
		"workspaces.applicationsRequestEncryptionSupportedLabel",
	requestEncryptionTargets:
		"workspaces.applicationsRequestEncryptionTargetsLabel",
	requestedScopes: "workspaces.applicationsRequestedScopesLabel",
	requestSigningAlgorithms: "workspaces.applicationsSignatureAlgorithmsLabel",
	requestSigningOtherAlgorithm:
		"workspaces.applicationsRequestSigningOtherAlgorithmLabel",
	requestSigningRevisitOn: "workspaces.applicationsRevisitOnLabel",
	requestSigningRoadmap: "workspaces.applicationsRoadmapLabel",
	requestSigningSupported:
		"workspaces.applicationsRequestSigningSupportedLabel",
	requestSigningTargets: "workspaces.applicationsRequestSigningTargetsLabel",
	sectorIdentifier: "workspaces.applicationsSectorIdentifierLabel",
	serviceNameEn: "workspaces.applicationsServiceNameEnLabel",
	serviceNameFr: "workspaces.applicationsServiceNameFrLabel",
	sharesPairwiseIdentifiers:
		"workspaces.applicationsSharesPairwiseIdentifiersLabel",
	signatureValidationAlgorithms:
		"workspaces.applicationsSignatureAlgorithmsLabel",
	signatureValidationOtherAlgorithm:
		"workspaces.applicationsSignatureValidationOtherAlgorithmLabel",
	signatureValidationRevisitOn: "workspaces.applicationsRevisitOnLabel",
	signatureValidationRoadmap: "workspaces.applicationsRoadmapLabel",
	signatureValidationSupported:
		"workspaces.applicationsSignatureValidationSupportedLabel",
	signatureValidationTargets:
		"workspaces.applicationsSignatureValidationTargetsLabel",
	supportsAuthorizationCodeFlow:
		"workspaces.applicationsAuthorizationCodeFlowLabel",
	jwksUri: "workspaces.applicationsJwksUriLabel",
};

const isDisplayable = (value: unknown): boolean =>
	value !== null &&
	value !== undefined &&
	value !== "" &&
	(!Array.isArray(value) || value.length > 0);

const displayValue = (value: unknown, yes: string, no: string): string => {
	if (typeof value === "boolean") return value ? yes : no;
	if (Array.isArray(value)) return value.map(String).join(", ");
	return String(value);
};

export const WorkspaceApplicationConfigurationPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const { currentUser } = useSession();
	const params = useParams({ strict: false });
	const workspaceUuid = params["workspaceUuid"] ?? "";
	const applicationInformationUuid = params["applicationInformationUuid"] ?? "";
	const rpApplicationUuid =
		params["rpConfigurationUuid"] || params["rpApplicationUuid"] || "";
	const { configuration, error, isLoading } =
		useApplicationRPConfigurationConfiguration(
			workspaceUuid,
			applicationInformationUuid,
			rpApplicationUuid
		);
	const canEdit = hasCapability(
		currentUser?.authorizationContext,
		"rp_configuration_write",
		workspaceUuid
	);
	const name = configuration
		? configuration.configurationName?.trim() ||
			getLocalizedRPApplicationName(
				configuration,
				i18n?.resolvedLanguage ?? i18n?.language ?? "en"
			) ||
			t("workspaces.rpConfigurationTitle")
		: t("workspaces.rpConfigurationTitle");
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "workspaces.rpConfigurationErrorBody",
		titleKey: "workspaces.rpConfigurationErrorTitle",
	});
	const resumeStep = configuration
		? getEarliestIncompleteRegistrationStep(
				configuration.registrationLastCompletedStep ?? null
			)
		: null;
	const resumePath = resumeStep
		? `/workspaces/${encodeURIComponent(workspaceUuid)}/applications/${encodeURIComponent(applicationInformationUuid)}/rp-configurations/${encodeURIComponent(rpApplicationUuid)}/registration/${resumeStep}`
		: null;
	const applicationName = configuration
		? (i18n?.resolvedLanguage ?? i18n?.language ?? "en").startsWith("fr")
			? configuration.serviceNameFr
			: configuration.serviceNameEn
		: null;

	useDocumentTitle(
		configuration
			? t("workspaces.rpConfigurationPageTitle", { name })
			: t("workspaces.rpConfigurationTitle"),
		t("home.title")
	);

	return (
		<div className="grid gap-400">
			<div>
				<Heading tag="h1">
					{configuration
						? t("workspaces.rpConfigurationPageTitle", { name })
						: t("workspaces.rpConfigurationTitle")}
				</Heading>
				<Text>{t("workspaces.rpConfigurationSummary")}</Text>
			</div>

			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("workspaces.rpConfigurationLoadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.rpConfigurationLoadingBody")}</Text>
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
					<Grid columns="1fr" columnsDesktop="12rem 1fr" tag="dl">
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
						</dd>
						<dt>
							<strong>{t("workspaces.applicationsEnvironmentLabel")}</strong>
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
						<dt>
							<strong>{t("workspaces.productionReviewLabel")}</strong>
						</dt>
						<dd>
							{configuration.promotionStatus?.trim()
								? getWorkspacePromotionStatusLabel(
										t as never,
										configuration.promotionStatus
									)
								: t("common.notAvailable")}
						</dd>
					</Grid>

					{configurationGroups.map((group) => {
						const values = group.fields.filter(
							(field) =>
								field !== "serviceNameEn" &&
								field !== "serviceNameFr" &&
								isDisplayable(configuration.registrationAnswers[field])
						);
						if (values.length === 0) return null;
						return (
							<section key={group.titleKey} className="grid gap-200">
								<Heading tag="h2">{t(group.titleKey as never)}</Heading>
								<Grid columns="1fr" columnsDesktop="16rem 1fr" tag="dl">
									{values.map((field) => (
										<div key={field} className="contents">
											<dt>
												<strong>
													{t((fieldLabelKeys[field] ?? field) as never)}
												</strong>
											</dt>
											<dd>
												{displayValue(
													field === "canadaLoginEnvironment"
														? getCanadaLoginEnvironmentLabel(
																t as never,
																String(configuration.registrationAnswers[field])
															)
														: configuration.registrationAnswers[field],
													t("common.yes"),
													t("common.no")
												)}
											</dd>
										</div>
									))}
								</Grid>
							</section>
						);
					})}

					{configuration.offlinePublicKeyProvided ? (
						<Text>{t("workspaces.rpConfigurationPublicKeyProvided")}</Text>
					) : null}

					<div className="flex flex-wrap gap-200">
						{canEdit &&
						configuration.onboardingState === "draft" &&
						resumePath ? (
							<Button href={resumePath} type="link">
								{t("workspaces.rpConfigurationResumeAction")}
							</Button>
						) : null}
						<Link
							href={`/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}`}
						>
							{t("workspaces.manageApplicationInformation")}
						</Link>
					</div>
				</>
			) : null}
		</div>
	);
};
