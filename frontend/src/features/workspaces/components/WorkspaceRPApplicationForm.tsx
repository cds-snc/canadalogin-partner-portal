import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import type { RegistrationDataStep } from "@/fetch/rp-applications";
import {
	Button,
	Checkboxes,
	Fieldset,
	Input,
	Radios,
	Select,
	Text,
	Textarea,
} from "@/components/ui";
import type { WorkspaceRPApplicationFormState } from "../workspace-rp-application-form";

type ApplicationInformationOption = {
	label: string;
	value: string;
};

type WorkspaceRPApplicationFormProps = {
	applicationInformationOptions: Array<ApplicationInformationOption>;
	backHref?: string;
	cancelHref: string;
	fieldErrors?: Partial<Record<keyof WorkspaceRPApplicationFormState, string>>;
	form: WorkspaceRPApplicationFormState;
	isSubmitting: boolean;
	onChange: (
		field: keyof WorkspaceRPApplicationFormState,
		value: string | Array<string>
	) => void;
	onBack?: () => void;
	onCancel?: () => void;
	onSaveAndExit?: () => void;
	onSubmit: () => void;
	saveAndExitLabel?: string;
	step?: RegistrationDataStep;
	submitLabel: string;
};

const asBooleanRadioOptions = (
	yesLabel: string,
	noLabel: string
): Array<{ id: string; label: string; value: string }> => [
	{ id: `${yesLabel}-yes`, label: yesLabel, value: "yes" },
	{ id: `${yesLabel}-no`, label: noLabel, value: "no" },
];

export const WorkspaceRPApplicationForm = ({
	applicationInformationOptions,
	backHref,
	cancelHref,
	fieldErrors,
	form,
	isSubmitting,
	onBack,
	onCancel,
	onChange,
	onSaveAndExit,
	onSubmit,
	saveAndExitLabel,
	step,
	submitLabel,
}: WorkspaceRPApplicationFormProps): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const yesNoOptions = asBooleanRadioOptions(
		t("workspaces.optionYes"),
		t("workspaces.optionNo")
	);

	return (
		<form
			className="grid gap-400"
			onSubmit={(event): void => {
				event.preventDefault();
				onSubmit();
			}}
		>
			{!step || step === "basics" ? (
				<Fieldset
					className="grid gap-300"
					legend={t("workspaces.applicationsBasicsLegend")}
					legendSize="h2"
				>
					<Select
						errorMessage={fieldErrors?.applicationInformationUuid}
						label={t("workspaces.applicationsApplicationInformationLabel")}
						name="applicationInformationUuid"
						selectId="workspace-rp-application-application-information"
						value={form.applicationInformationUuid}
						onInput={(event): void => {
							onChange(
								"applicationInformationUuid",
								(event.target as HTMLSelectElement).value
							);
						}}
					>
						<option value="">
							{t("workspaces.applicationsApplicationInformationNone")}
						</option>
						{applicationInformationOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
					<Select
						required
						errorMessage={fieldErrors?.canadaLoginEnvironment}
						label={t("workspaces.applicationsEnvironmentLabel")}
						name="canadaLoginEnvironment"
						selectId="workspace-rp-application-environment"
						value={form.canadaLoginEnvironment}
						onInput={(event): void => {
							onChange(
								"canadaLoginEnvironment",
								(event.target as HTMLSelectElement).value
							);
						}}
					>
						<option value="">
							{t("workspaces.applicationsSelectPlaceholder")}
						</option>
						<option value="test">
							{t("workspaces.applicationsEnvironmentTest")}
						</option>
						<option value="staging">
							{t("workspaces.applicationsEnvironmentStaging")}
						</option>
						<option value="production">
							{t("workspaces.applicationsEnvironmentProduction")}
						</option>
					</Select>
					<Input
						required
						errorMessage={fieldErrors?.serviceNameEn}
						inputId="workspace-rp-application-service-name-en"
						label={t("workspaces.applicationsServiceNameEnLabel")}
						name="serviceNameEn"
						value={form.serviceNameEn}
						onInput={(event): void => {
							onChange(
								"serviceNameEn",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
					<Input
						required
						errorMessage={fieldErrors?.serviceNameFr}
						inputId="workspace-rp-application-service-name-fr"
						label={t("workspaces.applicationsServiceNameFrLabel")}
						name="serviceNameFr"
						value={form.serviceNameFr}
						onInput={(event): void => {
							onChange(
								"serviceNameFr",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
				</Fieldset>
			) : null}

			{!step || step === "endpoints" ? (
				<Fieldset
					className="grid gap-300"
					legend={t("workspaces.registration.steps.endpoints")}
					legendSize="h2"
				>
					<Input
						required
						errorMessage={fieldErrors?.applicationEnvironmentUrlEn}
						inputId="workspace-rp-application-url-en"
						label={t("workspaces.applicationsUrlEnLabel")}
						name="applicationEnvironmentUrlEn"
						value={form.applicationEnvironmentUrlEn}
						onInput={(event): void => {
							onChange(
								"applicationEnvironmentUrlEn",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
					<Input
						required
						errorMessage={fieldErrors?.applicationEnvironmentUrlFr}
						inputId="workspace-rp-application-url-fr"
						label={t("workspaces.applicationsUrlFrLabel")}
						name="applicationEnvironmentUrlFr"
						value={form.applicationEnvironmentUrlFr}
						onInput={(event): void => {
							onChange(
								"applicationEnvironmentUrlFr",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
					<Textarea
						required
						errorMessage={fieldErrors?.redirectUris}
						hint={t("workspaces.applicationsUrisHint")}
						label={t("workspaces.applicationsRedirectUrisLabel")}
						name="redirectUris"
						textareaId="workspace-rp-application-redirect-uris"
						value={form.redirectUris}
						onInput={(event): void => {
							onChange(
								"redirectUris",
								(event.target as HTMLTextAreaElement).value
							);
						}}
					/>
					<Textarea
						errorMessage={fieldErrors?.postLogoutRedirectUris}
						hint={t("workspaces.applicationsUrisHint")}
						label={t("workspaces.applicationsPostLogoutRedirectUrisLabel")}
						name="postLogoutRedirectUris"
						textareaId="workspace-rp-application-post-logout-redirect-uris"
						value={form.postLogoutRedirectUris}
						onInput={(event): void => {
							onChange(
								"postLogoutRedirectUris",
								(event.target as HTMLTextAreaElement).value
							);
						}}
					/>
					<Radios
						required
						errorMessage={fieldErrors?.logoutMode}
						legend={t("workspaces.applicationsLogoutModeLabel")}
						name="logoutMode"
						value={form.logoutMode}
						options={[
							{
								id: "logout-back-channel",
								label: t("workspaces.applicationsLogoutModeBackChannel"),
								value: "back_channel",
							},
							{
								id: "logout-front-channel",
								label: t("workspaces.applicationsLogoutModeFrontChannel"),
								value: "front_channel",
							},
						]}
						onInput={(event): void => {
							onChange("logoutMode", (event.target as HTMLInputElement).value);
						}}
					/>
					<Input
						required
						errorMessage={fieldErrors?.logoutUri}
						inputId="workspace-rp-application-logout-uri"
						label={t("workspaces.applicationsLogoutUriLabel")}
						name="logoutUri"
						value={form.logoutUri}
						onInput={(event): void => {
							onChange("logoutUri", (event.target as HTMLInputElement).value);
						}}
					/>
				</Fieldset>
			) : null}

			{!step || step === "client-and-access" ? (
				<Fieldset
					className="grid gap-300"
					legend={t("workspaces.applicationsClientLegend")}
					legendSize="h2"
				>
					<Radios
						required
						errorMessage={fieldErrors?.supportsAuthorizationCodeFlow}
						legend={t("workspaces.applicationsAuthorizationCodeFlowLabel")}
						name="supportsAuthorizationCodeFlow"
						options={yesNoOptions}
						value={form.supportsAuthorizationCodeFlow}
						onInput={(event): void => {
							onChange(
								"supportsAuthorizationCodeFlow",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
					<Radios
						required
						errorMessage={fieldErrors?.clientType}
						legend={t("workspaces.applicationsClientTypeLabel")}
						name="clientType"
						value={form.clientType}
						options={[
							{
								id: "client-type-confidential",
								label: t("workspaces.applicationsClientTypeConfidential"),
								value: "confidential",
							},
							{
								id: "client-type-public",
								label: t("workspaces.applicationsClientTypePublic"),
								value: "public",
							},
						]}
						onInput={(event): void => {
							onChange("clientType", (event.target as HTMLInputElement).value);
						}}
					/>
					<Radios
						required
						errorMessage={fieldErrors?.clientAuthMethod}
						legend={t("workspaces.applicationsClientAuthMethodLabel")}
						name="clientAuthMethod"
						value={form.clientAuthMethod}
						options={[
							{
								id: "client-auth-private-key-jwt",
								label: t(
									"workspaces.applicationsClientAuthMethodPrivateKeyJwt"
								),
								value: "private_key_jwt",
							},
							{
								id: "client-auth-secret-basic",
								label: t(
									"workspaces.applicationsClientAuthMethodClientSecretBasic"
								),
								value: "client_secret_basic",
							},
							{
								id: "client-auth-secret-post",
								label: t(
									"workspaces.applicationsClientAuthMethodClientSecretPost"
								),
								value: "client_secret_post",
							},
						]}
						onInput={(event): void => {
							onChange(
								"clientAuthMethod",
								(event.target as HTMLInputElement).value
							);
						}}
					/>

					{form.clientAuthMethod === "private_key_jwt" ? (
						<>
							<Radios
								required
								errorMessage={fieldErrors?.privateKeyDistributionMethod}
								legend={t("workspaces.applicationsPrivateKeyDistributionLabel")}
								name="privateKeyDistributionMethod"
								value={form.privateKeyDistributionMethod}
								options={[
									{
										id: "private-key-distribution-jwks",
										label: t(
											"workspaces.applicationsPrivateKeyDistributionJwksUri"
										),
										value: "jwks_uri",
									},
									{
										id: "private-key-distribution-offline",
										label: t(
											"workspaces.applicationsPrivateKeyDistributionOfflineExchange"
										),
										value: "offline_exchange",
									},
									{
										id: "private-key-distribution-not-available",
										label: t(
											"workspaces.applicationsPrivateKeyDistributionNotAvailable"
										),
										value: "not_available",
									},
								]}
								onInput={(event): void => {
									onChange(
										"privateKeyDistributionMethod",
										(event.target as HTMLInputElement).value
									);
								}}
							/>
							{form.privateKeyDistributionMethod === "jwks_uri" ? (
								<Input
									required
									errorMessage={fieldErrors?.jwksUri}
									inputId="workspace-rp-application-jwks-uri"
									label={t("workspaces.applicationsJwksUriLabel")}
									name="jwksUri"
									value={form.jwksUri}
									onInput={(event): void => {
										onChange(
											"jwksUri",
											(event.target as HTMLInputElement).value
										);
									}}
								/>
							) : null}
							{form.privateKeyDistributionMethod === "offline_exchange" ? (
								<Textarea
									required
									errorMessage={fieldErrors?.offlineJwkOrCertificate}
									name="offlineJwkOrCertificate"
									textareaId="workspace-rp-application-offline-jwk-or-certificate"
									value={form.offlineJwkOrCertificate}
									label={t(
										"workspaces.applicationsOfflineJwkOrCertificateLabel"
									)}
									onInput={(event): void => {
										onChange(
											"offlineJwkOrCertificate",
											(event.target as HTMLTextAreaElement).value
										);
									}}
								/>
							) : null}
						</>
					) : null}

					<Checkboxes
						required
						errorMessage={fieldErrors?.requestedScopes}
						legend={t("workspaces.applicationsRequestedScopesLabel")}
						name="requestedScopes"
						value={form.requestedScopes}
						options={[
							{ id: "scope-openid", label: "openid", value: "openid" },
							{ id: "scope-profile", label: "profile", value: "profile" },
							{ id: "scope-email", label: "email", value: "email" },
							{ id: "scope-phone", label: "phone", value: "phone" },
							{ id: "scope-language", label: "language", value: "language" },
						]}
						onInput={(event): void => {
							onChange("requestedScopes", event.target.value);
						}}
					/>
					<Input
						required
						errorMessage={fieldErrors?.sectorIdentifier}
						inputId="workspace-rp-application-sector-identifier"
						label={t("workspaces.applicationsSectorIdentifierLabel")}
						name="sectorIdentifier"
						value={form.sectorIdentifier}
						onInput={(event): void => {
							onChange(
								"sectorIdentifier",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
					<Radios
						required
						errorMessage={fieldErrors?.sharesPairwiseIdentifiers}
						legend={t("workspaces.applicationsSharesPairwiseIdentifiersLabel")}
						name="sharesPairwiseIdentifiers"
						options={yesNoOptions}
						value={form.sharesPairwiseIdentifiers}
						onInput={(event): void => {
							onChange(
								"sharesPairwiseIdentifiers",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
					<Input
						errorMessage={fieldErrors?.migrationSectorIdentifierUrl}
						inputId="workspace-rp-application-migration-sector-identifier-url"
						name="migrationSectorIdentifierUrl"
						value={form.migrationSectorIdentifierUrl}
						label={t(
							"workspaces.applicationsMigrationSectorIdentifierUrlLabel"
						)}
						onInput={(event): void => {
							onChange(
								"migrationSectorIdentifierUrl",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
					<Radios
						required
						errorMessage={fieldErrors?.pkceSupported}
						legend={t("workspaces.applicationsPkceSupportedLabel")}
						name="pkceSupported"
						options={yesNoOptions}
						value={form.pkceSupported}
						onInput={(event): void => {
							onChange(
								"pkceSupported",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
					{form.pkceSupported === "yes" ? (
						<>
							<Checkboxes
								required
								errorMessage={fieldErrors?.pkceAlgorithms}
								legend={t("workspaces.applicationsPkceAlgorithmsLabel")}
								name="pkceAlgorithms"
								value={form.pkceAlgorithms}
								options={[
									{ id: "pkce-s256", label: "S256", value: "S256" },
									{
										id: "pkce-other",
										label: t("workspaces.applicationsOptionOther"),
										value: "other",
									},
								]}
								onInput={(event): void => {
									onChange("pkceAlgorithms", event.target.value);
								}}
							/>
							{form.pkceAlgorithms.includes("other") ? (
								<Input
									required
									errorMessage={fieldErrors?.pkceOtherAlgorithm}
									inputId="workspace-rp-application-pkce-other-algorithm"
									label={t("workspaces.applicationsPkceOtherAlgorithmLabel")}
									name="pkceOtherAlgorithm"
									value={form.pkceOtherAlgorithm}
									onInput={(event): void => {
										onChange(
											"pkceOtherAlgorithm",
											(event.target as HTMLInputElement).value
										);
									}}
								/>
							) : null}
						</>
					) : null}
				</Fieldset>
			) : null}

			{!step || step === "signing" ? (
				<Fieldset
					className="grid gap-300"
					legend={t("workspaces.applicationsSigningLegend")}
					legendSize="h2"
				>
					<Radios
						required
						errorMessage={fieldErrors?.requestSigningSupported}
						legend={t("workspaces.applicationsRequestSigningSupportedLabel")}
						name="requestSigningSupported"
						options={yesNoOptions}
						value={form.requestSigningSupported}
						onInput={(event): void => {
							onChange(
								"requestSigningSupported",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
					{form.requestSigningSupported === "yes" ? (
						<>
							<Checkboxes
								required
								errorMessage={fieldErrors?.requestSigningTargets}
								legend={t("workspaces.applicationsRequestSigningTargetsLabel")}
								name="requestSigningTargets"
								value={form.requestSigningTargets}
								options={[
									{
										id: "request-signing-request-object",
										label: t(
											"workspaces.applicationsRequestSigningTargetRequestObject"
										),
										value: "request_object",
									},
									{
										id: "request-signing-token-endpoint",
										label: t(
											"workspaces.applicationsRequestSigningTargetTokenEndpoint"
										),
										value: "token_endpoint",
									},
								]}
								onInput={(event): void => {
									onChange("requestSigningTargets", event.target.value);
								}}
							/>
							<Checkboxes
								required
								errorMessage={fieldErrors?.requestSigningAlgorithms}
								legend={t("workspaces.applicationsSignatureAlgorithmsLabel")}
								name="requestSigningAlgorithms"
								value={form.requestSigningAlgorithms}
								options={[
									{ id: "signature-rs256", label: "RS256", value: "RS256" },
									{ id: "signature-rs384", label: "RS384", value: "RS384" },
									{ id: "signature-rs512", label: "RS512", value: "RS512" },
									{ id: "signature-ps256", label: "PS256", value: "PS256" },
									{ id: "signature-ps384", label: "PS384", value: "PS384" },
									{ id: "signature-ps512", label: "PS512", value: "PS512" },
									{ id: "signature-es256", label: "ES256", value: "ES256" },
									{ id: "signature-es384", label: "ES384", value: "ES384" },
									{ id: "signature-es512", label: "ES512", value: "ES512" },
									{
										id: "signature-other",
										label: t("workspaces.applicationsOptionOther"),
										value: "other",
									},
								]}
								onInput={(event): void => {
									onChange("requestSigningAlgorithms", event.target.value);
								}}
							/>
							{form.requestSigningAlgorithms.includes("other") ? (
								<Input
									required
									errorMessage={fieldErrors?.requestSigningOtherAlgorithm}
									inputId="workspace-rp-application-request-signing-other-algorithm"
									name="requestSigningOtherAlgorithm"
									value={form.requestSigningOtherAlgorithm}
									label={t(
										"workspaces.applicationsRequestSigningOtherAlgorithmLabel"
									)}
									onInput={(event): void => {
										onChange(
											"requestSigningOtherAlgorithm",
											(event.target as HTMLInputElement).value
										);
									}}
								/>
							) : null}
						</>
					) : null}
					{form.requestSigningSupported === "no" ? (
						<>
							<Radios
								required
								errorMessage={fieldErrors?.requestSigningRoadmap}
								legend={t("workspaces.applicationsRoadmapLabel")}
								name="requestSigningRoadmap"
								options={yesNoOptions}
								value={form.requestSigningRoadmap}
								onInput={(event): void => {
									onChange(
										"requestSigningRoadmap",
										(event.target as HTMLInputElement).value
									);
								}}
							/>
							{form.requestSigningRoadmap === "yes" ? (
								<Input
									required
									errorMessage={fieldErrors?.requestSigningRevisitOn}
									inputId="workspace-rp-application-request-signing-revisit-on"
									label={t("workspaces.applicationsRevisitOnLabel")}
									name="requestSigningRevisitOn"
									value={form.requestSigningRevisitOn}
									onInput={(event): void => {
										onChange(
											"requestSigningRevisitOn",
											(event.target as HTMLInputElement).value
										);
									}}
								/>
							) : null}
						</>
					) : null}

					<Radios
						required
						errorMessage={fieldErrors?.signatureValidationSupported}
						name="signatureValidationSupported"
						options={yesNoOptions}
						value={form.signatureValidationSupported}
						legend={t(
							"workspaces.applicationsSignatureValidationSupportedLabel"
						)}
						onInput={(event): void => {
							onChange(
								"signatureValidationSupported",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
					{form.signatureValidationSupported === "yes" ? (
						<>
							<Checkboxes
								required
								errorMessage={fieldErrors?.signatureValidationTargets}
								name="signatureValidationTargets"
								value={form.signatureValidationTargets}
								legend={t(
									"workspaces.applicationsSignatureValidationTargetsLabel"
								)}
								options={[
									{
										id: "signature-validation-id-token",
										label: t(
											"workspaces.applicationsSignatureValidationTargetIdToken"
										),
										value: "id_token",
									},
									{
										id: "signature-validation-userinfo",
										label: t(
											"workspaces.applicationsSignatureValidationTargetUserinfo"
										),
										value: "userinfo",
									},
								]}
								onInput={(event): void => {
									onChange("signatureValidationTargets", event.target.value);
								}}
							/>
							<Checkboxes
								required
								errorMessage={fieldErrors?.signatureValidationAlgorithms}
								legend={t("workspaces.applicationsSignatureAlgorithmsLabel")}
								name="signatureValidationAlgorithms"
								value={form.signatureValidationAlgorithms}
								options={[
									{
										id: "signature-validation-rs256",
										label: "RS256",
										value: "RS256",
									},
									{
										id: "signature-validation-rs384",
										label: "RS384",
										value: "RS384",
									},
									{
										id: "signature-validation-rs512",
										label: "RS512",
										value: "RS512",
									},
									{
										id: "signature-validation-ps256",
										label: "PS256",
										value: "PS256",
									},
									{
										id: "signature-validation-ps384",
										label: "PS384",
										value: "PS384",
									},
									{
										id: "signature-validation-ps512",
										label: "PS512",
										value: "PS512",
									},
									{
										id: "signature-validation-es256",
										label: "ES256",
										value: "ES256",
									},
									{
										id: "signature-validation-es384",
										label: "ES384",
										value: "ES384",
									},
									{
										id: "signature-validation-es512",
										label: "ES512",
										value: "ES512",
									},
									{
										id: "signature-validation-other",
										label: t("workspaces.applicationsOptionOther"),
										value: "other",
									},
								]}
								onInput={(event): void => {
									onChange("signatureValidationAlgorithms", event.target.value);
								}}
							/>
							{form.signatureValidationAlgorithms.includes("other") ? (
								<Input
									required
									errorMessage={fieldErrors?.signatureValidationOtherAlgorithm}
									inputId="workspace-rp-application-signature-validation-other-algorithm"
									name="signatureValidationOtherAlgorithm"
									value={form.signatureValidationOtherAlgorithm}
									label={t(
										"workspaces.applicationsSignatureValidationOtherAlgorithmLabel"
									)}
									onInput={(event): void => {
										onChange(
											"signatureValidationOtherAlgorithm",
											(event.target as HTMLInputElement).value
										);
									}}
								/>
							) : null}
						</>
					) : null}
					{form.signatureValidationSupported === "no" ? (
						<>
							<Radios
								required
								errorMessage={fieldErrors?.signatureValidationRoadmap}
								legend={t("workspaces.applicationsRoadmapLabel")}
								name="signatureValidationRoadmap"
								options={yesNoOptions}
								value={form.signatureValidationRoadmap}
								onInput={(event): void => {
									onChange(
										"signatureValidationRoadmap",
										(event.target as HTMLInputElement).value
									);
								}}
							/>
							{form.signatureValidationRoadmap === "yes" ? (
								<Input
									required
									errorMessage={fieldErrors?.signatureValidationRevisitOn}
									inputId="workspace-rp-application-signature-validation-revisit-on"
									label={t("workspaces.applicationsRevisitOnLabel")}
									name="signatureValidationRevisitOn"
									value={form.signatureValidationRevisitOn}
									onInput={(event): void => {
										onChange(
											"signatureValidationRevisitOn",
											(event.target as HTMLInputElement).value
										);
									}}
								/>
							) : null}
						</>
					) : null}
				</Fieldset>
			) : null}

			{!step || step === "encryption" ? (
				<Fieldset
					className="grid gap-300"
					legend={t("workspaces.applicationsEncryptionLegend")}
					legendSize="h2"
				>
					<Radios
						required
						errorMessage={fieldErrors?.requestEncryptionSupported}
						legend={t("workspaces.applicationsRequestEncryptionSupportedLabel")}
						name="requestEncryptionSupported"
						options={yesNoOptions}
						value={form.requestEncryptionSupported}
						onInput={(event): void => {
							onChange(
								"requestEncryptionSupported",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
					{form.requestEncryptionSupported === "yes" ? (
						<>
							<Checkboxes
								required
								errorMessage={fieldErrors?.requestEncryptionTargets}
								name="requestEncryptionTargets"
								value={form.requestEncryptionTargets}
								legend={t(
									"workspaces.applicationsRequestEncryptionTargetsLabel"
								)}
								options={[
									{
										id: "request-encryption-request-object",
										label: t(
											"workspaces.applicationsRequestEncryptionTargetRequestObject"
										),
										value: "request_object",
									},
								]}
								onInput={(event): void => {
									onChange("requestEncryptionTargets", event.target.value);
								}}
							/>
							<Checkboxes
								required
								name="requestEncryptionKeyManagementAlgorithms"
								value={form.requestEncryptionKeyManagementAlgorithms}
								errorMessage={
									fieldErrors?.requestEncryptionKeyManagementAlgorithms
								}
								legend={t(
									"workspaces.applicationsKeyManagementAlgorithmsLabel"
								)}
								options={[
									{
										id: "key-management-rsa-oaep-256",
										label: "RSA-OAEP-256",
										value: "RSA-OAEP-256",
									},
									{
										id: "key-management-rsa-oaep",
										label: "RSA-OAEP",
										value: "RSA-OAEP",
									},
									{
										id: "key-management-other",
										label: t("workspaces.applicationsOptionOther"),
										value: "other",
									},
								]}
								onInput={(event): void => {
									onChange(
										"requestEncryptionKeyManagementAlgorithms",
										event.target.value
									);
								}}
							/>
							{form.requestEncryptionKeyManagementAlgorithms.includes(
								"other"
							) ? (
								<Input
									required
									inputId="workspace-rp-application-request-encryption-other-key-management-algorithm"
									name="requestEncryptionOtherKeyManagementAlgorithm"
									value={form.requestEncryptionOtherKeyManagementAlgorithm}
									errorMessage={
										fieldErrors?.requestEncryptionOtherKeyManagementAlgorithm
									}
									label={t(
										"workspaces.applicationsOtherKeyManagementAlgorithmLabel"
									)}
									onInput={(event): void => {
										onChange(
											"requestEncryptionOtherKeyManagementAlgorithm",
											(event.target as HTMLInputElement).value
										);
									}}
								/>
							) : null}
							<Checkboxes
								required
								errorMessage={fieldErrors?.requestEncryptionContentAlgorithms}
								name="requestEncryptionContentAlgorithms"
								value={form.requestEncryptionContentAlgorithms}
								legend={t(
									"workspaces.applicationsContentEncryptionAlgorithmsLabel"
								)}
								options={[
									{
										id: "content-encryption-a128gcm",
										label: "A128GCM",
										value: "A128GCM",
									},
									{
										id: "content-encryption-a192gcm",
										label: "A192GCM",
										value: "A192GCM",
									},
									{
										id: "content-encryption-a256gcm",
										label: "A256GCM",
										value: "A256GCM",
									},
									{
										id: "content-encryption-other",
										label: t("workspaces.applicationsOptionOther"),
										value: "other",
									},
								]}
								onInput={(event): void => {
									onChange(
										"requestEncryptionContentAlgorithms",
										event.target.value
									);
								}}
							/>
							{form.requestEncryptionContentAlgorithms.includes("other") ? (
								<Input
									required
									inputId="workspace-rp-application-request-encryption-other-content-algorithm"
									label={t("workspaces.applicationsOtherContentAlgorithmLabel")}
									name="requestEncryptionOtherContentAlgorithm"
									value={form.requestEncryptionOtherContentAlgorithm}
									errorMessage={
										fieldErrors?.requestEncryptionOtherContentAlgorithm
									}
									onInput={(event): void => {
										onChange(
											"requestEncryptionOtherContentAlgorithm",
											(event.target as HTMLInputElement).value
										);
									}}
								/>
							) : null}
						</>
					) : null}
					{form.requestEncryptionSupported === "no" ? (
						<>
							<Radios
								required
								errorMessage={fieldErrors?.requestEncryptionRoadmap}
								legend={t("workspaces.applicationsRoadmapLabel")}
								name="requestEncryptionRoadmap"
								options={yesNoOptions}
								value={form.requestEncryptionRoadmap}
								onInput={(event): void => {
									onChange(
										"requestEncryptionRoadmap",
										(event.target as HTMLInputElement).value
									);
								}}
							/>
							{form.requestEncryptionRoadmap === "yes" ? (
								<Input
									required
									errorMessage={fieldErrors?.requestEncryptionRevisitOn}
									inputId="workspace-rp-application-request-encryption-revisit-on"
									label={t("workspaces.applicationsRevisitOnLabel")}
									name="requestEncryptionRevisitOn"
									value={form.requestEncryptionRevisitOn}
									onInput={(event): void => {
										onChange(
											"requestEncryptionRevisitOn",
											(event.target as HTMLInputElement).value
										);
									}}
								/>
							) : null}
						</>
					) : null}

					<Radios
						required
						errorMessage={fieldErrors?.messageDecryptionSupported}
						legend={t("workspaces.applicationsMessageDecryptionSupportedLabel")}
						name="messageDecryptionSupported"
						options={yesNoOptions}
						value={form.messageDecryptionSupported}
						onInput={(event): void => {
							onChange(
								"messageDecryptionSupported",
								(event.target as HTMLInputElement).value
							);
						}}
					/>
					{form.messageDecryptionSupported === "yes" ? (
						<>
							<Checkboxes
								required
								errorMessage={fieldErrors?.messageDecryptionTargets}
								name="messageDecryptionTargets"
								value={form.messageDecryptionTargets}
								legend={t(
									"workspaces.applicationsMessageDecryptionTargetsLabel"
								)}
								options={[
									{
										id: "message-decryption-token-endpoint-response",
										label: t(
											"workspaces.applicationsMessageDecryptionTargetTokenEndpointResponse"
										),
										value: "token_endpoint_response",
									},
									{
										id: "message-decryption-id-token",
										label: t(
											"workspaces.applicationsSignatureValidationTargetIdToken"
										),
										value: "id_token",
									},
									{
										id: "message-decryption-userinfo",
										label: t(
											"workspaces.applicationsSignatureValidationTargetUserinfo"
										),
										value: "userinfo",
									},
								]}
								onInput={(event): void => {
									onChange("messageDecryptionTargets", event.target.value);
								}}
							/>
							<Checkboxes
								required
								name="messageDecryptionKeyManagementAlgorithms"
								value={form.messageDecryptionKeyManagementAlgorithms}
								errorMessage={
									fieldErrors?.messageDecryptionKeyManagementAlgorithms
								}
								legend={t(
									"workspaces.applicationsKeyManagementAlgorithmsLabel"
								)}
								options={[
									{
										id: "message-decryption-rsa-oaep-256",
										label: "RSA-OAEP-256",
										value: "RSA-OAEP-256",
									},
									{
										id: "message-decryption-rsa-oaep",
										label: "RSA-OAEP",
										value: "RSA-OAEP",
									},
									{
										id: "message-decryption-other",
										label: t("workspaces.applicationsOptionOther"),
										value: "other",
									},
								]}
								onInput={(event): void => {
									onChange(
										"messageDecryptionKeyManagementAlgorithms",
										event.target.value
									);
								}}
							/>
							{form.messageDecryptionKeyManagementAlgorithms.includes(
								"other"
							) ? (
								<Input
									required
									inputId="workspace-rp-application-message-decryption-other-key-management-algorithm"
									name="messageDecryptionOtherKeyManagementAlgorithm"
									value={form.messageDecryptionOtherKeyManagementAlgorithm}
									errorMessage={
										fieldErrors?.messageDecryptionOtherKeyManagementAlgorithm
									}
									label={t(
										"workspaces.applicationsOtherKeyManagementAlgorithmLabel"
									)}
									onInput={(event): void => {
										onChange(
											"messageDecryptionOtherKeyManagementAlgorithm",
											(event.target as HTMLInputElement).value
										);
									}}
								/>
							) : null}
							<Checkboxes
								required
								errorMessage={fieldErrors?.messageDecryptionContentAlgorithms}
								name="messageDecryptionContentAlgorithms"
								value={form.messageDecryptionContentAlgorithms}
								legend={t(
									"workspaces.applicationsContentEncryptionAlgorithmsLabel"
								)}
								options={[
									{
										id: "message-decryption-a128gcm",
										label: "A128GCM",
										value: "A128GCM",
									},
									{
										id: "message-decryption-a192gcm",
										label: "A192GCM",
										value: "A192GCM",
									},
									{
										id: "message-decryption-a256gcm",
										label: "A256GCM",
										value: "A256GCM",
									},
									{
										id: "message-decryption-content-other",
										label: t("workspaces.applicationsOptionOther"),
										value: "other",
									},
								]}
								onInput={(event): void => {
									onChange(
										"messageDecryptionContentAlgorithms",
										event.target.value
									);
								}}
							/>
							{form.messageDecryptionContentAlgorithms.includes("other") ? (
								<Input
									required
									inputId="workspace-rp-application-message-decryption-other-content-algorithm"
									label={t("workspaces.applicationsOtherContentAlgorithmLabel")}
									name="messageDecryptionOtherContentAlgorithm"
									value={form.messageDecryptionOtherContentAlgorithm}
									errorMessage={
										fieldErrors?.messageDecryptionOtherContentAlgorithm
									}
									onInput={(event): void => {
										onChange(
											"messageDecryptionOtherContentAlgorithm",
											(event.target as HTMLInputElement).value
										);
									}}
								/>
							) : null}
						</>
					) : null}
					{form.messageDecryptionSupported === "no" ? (
						<>
							<Radios
								required
								errorMessage={fieldErrors?.messageDecryptionRoadmap}
								legend={t("workspaces.applicationsRoadmapLabel")}
								name="messageDecryptionRoadmap"
								options={yesNoOptions}
								value={form.messageDecryptionRoadmap}
								onInput={(event): void => {
									onChange(
										"messageDecryptionRoadmap",
										(event.target as HTMLInputElement).value
									);
								}}
							/>
							{form.messageDecryptionRoadmap === "yes" ? (
								<Input
									required
									errorMessage={fieldErrors?.messageDecryptionRevisitOn}
									inputId="workspace-rp-application-message-decryption-revisit-on"
									label={t("workspaces.applicationsRevisitOnLabel")}
									name="messageDecryptionRevisitOn"
									value={form.messageDecryptionRevisitOn}
									onInput={(event): void => {
										onChange(
											"messageDecryptionRevisitOn",
											(event.target as HTMLInputElement).value
										);
									}}
								/>
							) : null}
						</>
					) : null}
				</Fieldset>
			) : null}

			<div className="grid gap-200">
				<Text>{t("workspaces.applicationsValidationHint")}</Text>
				<div className="flex flex-wrap gap-200">
					<Button disabled={isSubmitting} type="submit">
						{submitLabel}
					</Button>
					{onSaveAndExit && saveAndExitLabel ? (
						<Button
							buttonRole="secondary"
							disabled={isSubmitting}
							type="button"
							onGcdsClick={onSaveAndExit}
						>
							{saveAndExitLabel}
						</Button>
					) : null}
					{backHref ? (
						onBack ? (
							<Button buttonRole="secondary" type="button" onGcdsClick={onBack}>
								{t("workspaces.registration.backAction")}
							</Button>
						) : (
							<Button buttonRole="secondary" href={backHref} type="link">
								{t("workspaces.registration.backAction")}
							</Button>
						)
					) : null}
					{onCancel ? (
						<Button buttonRole="secondary" type="button" onGcdsClick={onCancel}>
							{t("workspaces.cancelAction")}
						</Button>
					) : (
						<Button buttonRole="secondary" href={cancelHref} type="link">
							{t("workspaces.cancelAction")}
						</Button>
					)}
				</div>
			</div>
		</form>
	);
};
