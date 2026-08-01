import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
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
	cancelHref: string;
	form: WorkspaceRPApplicationFormState;
	isSubmitting: boolean;
	onChange: (
		field: keyof WorkspaceRPApplicationFormState,
		value: string | Array<string>
	) => void;
	onSubmit: () => void;
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
	cancelHref,
	form,
	isSubmitting,
	onChange,
	onSubmit,
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
		<div className="grid gap-400">
			<Fieldset
				className="grid gap-300"
				legend={t("workspaces.applicationsBasicsLegend")}
				legendSize="h2"
			>
				<Select
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
					inputId="workspace-rp-application-service-name-en"
					label={t("workspaces.applicationsServiceNameEnLabel")}
					name="serviceNameEn"
					value={form.serviceNameEn}
					onInput={(event): void => {
						onChange("serviceNameEn", (event.target as HTMLInputElement).value);
					}}
				/>
				<Input
					required
					inputId="workspace-rp-application-service-name-fr"
					label={t("workspaces.applicationsServiceNameFrLabel")}
					name="serviceNameFr"
					value={form.serviceNameFr}
					onInput={(event): void => {
						onChange("serviceNameFr", (event.target as HTMLInputElement).value);
					}}
				/>
				<Input
					required
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
					inputId="workspace-rp-application-logout-uri"
					label={t("workspaces.applicationsLogoutUriLabel")}
					name="logoutUri"
					value={form.logoutUri}
					onInput={(event): void => {
						onChange("logoutUri", (event.target as HTMLInputElement).value);
					}}
				/>
			</Fieldset>

			<Fieldset
				className="grid gap-300"
				legend={t("workspaces.applicationsClientLegend")}
				legendSize="h2"
			>
				<Radios
					required
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
					legend={t("workspaces.applicationsClientAuthMethodLabel")}
					name="clientAuthMethod"
					value={form.clientAuthMethod}
					options={[
						{
							id: "client-auth-private-key-jwt",
							label: t("workspaces.applicationsClientAuthMethodPrivateKeyJwt"),
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
								inputId="workspace-rp-application-jwks-uri"
								label={t("workspaces.applicationsJwksUriLabel")}
								name="jwksUri"
								value={form.jwksUri}
								onInput={(event): void => {
									onChange("jwksUri", (event.target as HTMLInputElement).value);
								}}
							/>
						) : null}
						{form.privateKeyDistributionMethod === "offline_exchange" ? (
							<Textarea
								required
								label={t("workspaces.applicationsOfflineJwkOrCertificateLabel")}
								name="offlineJwkOrCertificate"
								textareaId="workspace-rp-application-offline-jwk-or-certificate"
								value={form.offlineJwkOrCertificate}
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
					inputId="workspace-rp-application-migration-sector-identifier-url"
					label={t("workspaces.applicationsMigrationSectorIdentifierUrlLabel")}
					name="migrationSectorIdentifierUrl"
					value={form.migrationSectorIdentifierUrl}
					onInput={(event): void => {
						onChange(
							"migrationSectorIdentifierUrl",
							(event.target as HTMLInputElement).value
						);
					}}
				/>
				<Radios
					required
					legend={t("workspaces.applicationsPkceSupportedLabel")}
					name="pkceSupported"
					options={yesNoOptions}
					value={form.pkceSupported}
					onInput={(event): void => {
						onChange("pkceSupported", (event.target as HTMLInputElement).value);
					}}
				/>
				{form.pkceSupported === "yes" ? (
					<>
						<Checkboxes
							required
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

			<Fieldset
				className="grid gap-300"
				legend={t("workspaces.applicationsSigningLegend")}
				legendSize="h2"
			>
				<Radios
					required
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
								inputId="workspace-rp-application-request-signing-other-algorithm"
								label={t("workspaces.applicationsRequestSigningOtherAlgorithmLabel")}
								name="requestSigningOtherAlgorithm"
								value={form.requestSigningOtherAlgorithm}
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
					legend={t("workspaces.applicationsSignatureValidationSupportedLabel")}
					name="signatureValidationSupported"
					options={yesNoOptions}
					value={form.signatureValidationSupported}
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
							legend={t("workspaces.applicationsSignatureValidationTargetsLabel")}
							name="signatureValidationTargets"
							value={form.signatureValidationTargets}
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
								inputId="workspace-rp-application-signature-validation-other-algorithm"
								label={t("workspaces.applicationsSignatureValidationOtherAlgorithmLabel")}
								name="signatureValidationOtherAlgorithm"
								value={form.signatureValidationOtherAlgorithm}
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

			<Fieldset
				className="grid gap-300"
				legend={t("workspaces.applicationsEncryptionLegend")}
				legendSize="h2"
			>
				<Radios
					required
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
							legend={t("workspaces.applicationsRequestEncryptionTargetsLabel")}
							name="requestEncryptionTargets"
							value={form.requestEncryptionTargets}
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
							legend={t("workspaces.applicationsKeyManagementAlgorithmsLabel")}
							name="requestEncryptionKeyManagementAlgorithms"
							value={form.requestEncryptionKeyManagementAlgorithms}
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
						{form.requestEncryptionKeyManagementAlgorithms.includes("other") ? (
							<Input
								required
								inputId="workspace-rp-application-request-encryption-other-key-management-algorithm"
								label={t("workspaces.applicationsOtherKeyManagementAlgorithmLabel")}
								name="requestEncryptionOtherKeyManagementAlgorithm"
								value={form.requestEncryptionOtherKeyManagementAlgorithm}
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
							legend={t("workspaces.applicationsContentEncryptionAlgorithmsLabel")}
							name="requestEncryptionContentAlgorithms"
							value={form.requestEncryptionContentAlgorithms}
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
							legend={t("workspaces.applicationsMessageDecryptionTargetsLabel")}
							name="messageDecryptionTargets"
							value={form.messageDecryptionTargets}
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
							legend={t("workspaces.applicationsKeyManagementAlgorithmsLabel")}
							name="messageDecryptionKeyManagementAlgorithms"
							value={form.messageDecryptionKeyManagementAlgorithms}
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
						{form.messageDecryptionKeyManagementAlgorithms.includes("other") ? (
							<Input
								required
								inputId="workspace-rp-application-message-decryption-other-key-management-algorithm"
								label={t("workspaces.applicationsOtherKeyManagementAlgorithmLabel")}
								name="messageDecryptionOtherKeyManagementAlgorithm"
								value={form.messageDecryptionOtherKeyManagementAlgorithm}
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
							legend={t("workspaces.applicationsContentEncryptionAlgorithmsLabel")}
							name="messageDecryptionContentAlgorithms"
							value={form.messageDecryptionContentAlgorithms}
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

			<div className="grid gap-200">
				<Text>{t("workspaces.applicationsValidationHint")}</Text>
				<div className="flex flex-wrap gap-200">
					<Button disabled={isSubmitting} type="button" onGcdsClick={onSubmit}>
						{submitLabel}
					</Button>
					<Button buttonRole="secondary" href={cancelHref} type="link">
						{t("workspaces.cancelAction")}
					</Button>
				</div>
			</div>
		</div>
	);
};
