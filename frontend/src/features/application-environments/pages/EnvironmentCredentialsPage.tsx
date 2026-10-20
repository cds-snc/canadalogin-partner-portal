import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useToast } from "@/components/ui/Toast";
import {
	Alert,
	Button,
	ErrorSummary,
	Grid,
	Heading,
	Icon,
	Input,
	Link,
	Modal,
	Notice,
	Tabs,
	Text,
} from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useApplicationEnvironment } from "../hooks/use-application-environment";
import { useApplicationEnvironments } from "../hooks/use-application-environments";
import { useApplicationEnvironmentCredentials } from "../hooks/use-application-environment-credentials";
import "./environments-page.css";

const ROTATED_SECRET_EXPIRY_DAYS = 7;
const MASKED_SECRET = "****************";

const formatExpiry = (
	epochSeconds: number | null,
	language: string,
	fallback: string
): string => {
	if (epochSeconds === null) {
		return fallback;
	}
	return new Intl.DateTimeFormat(language, {
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		month: "long",
		timeZoneName: "short",
		year: "numeric",
	}).format(new Date(epochSeconds * 1000));
};

export const EnvironmentCredentialsPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const navigate = useNavigate({
		from: "/applications/$applicationUuid/environments/$environmentUuid",
	});
	const toast = useToast();
	const { applicationUuid, environmentUuid } = useParams({
		from: "/applications/$applicationUuid/environments/$environmentUuid",
	});
	const {
		data: environment,
		error,
		isLoading,
	} = useApplicationEnvironment(applicationUuid, environmentUuid);
	const { data: environments } = useApplicationEnvironments(
		applicationUuid,
		1,
		1
	);
	const applicationName =
		i18n.resolvedLanguage === "fr" && environments?.application.nameFr
			? environments.application.nameFr
			: (environments?.application.nameEn ??
				t("applicationEnvironmentConnect.applicationNameFallback"));
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "applicationEnvironmentManagement.errorBody",
		titleKey: "applicationEnvironmentManagement.errorTitle",
	});
	const isPrivateKeyJwt =
		environment?.config?.clientAuthMethod === "private_key_jwt";
	const isPublicClient = environment?.config?.clientType === "public";
	const isProduction = environment?.tenantCode === "production";
	const isClientSecretEnvironment = !isPublicClient && !isPrivateKeyJwt;
	const jwksUri = environment?.config?.jwksUri;
	const {
		credentials,
		deleteRotatedSecret,
		getClientCredentials,
		isDeletingRotatedSecret,
		isLoadingClientCredentials,
		isLoadingPermissions,
		isLoadingRotatedSecrets,
		isRotatingSecret,
		permissions,
		permissionsError,
		rotatedSecrets,
		rotateSecret,
	} = useApplicationEnvironmentCredentials(
		applicationUuid,
		environmentUuid,
		Boolean(environment && isClientSecretEnvironment),
		isProduction
	);
	const [isSecretVisible, setIsSecretVisible] = useState(false);
	const [rotationReason, setRotationReason] = useState("");
	const [rotationReasonError, setRotationReasonError] = useState("");
	const [operationError, setOperationError] = useState<
		"expire" | "retrieve" | "rotate" | null
	>(null);
	const [isRotateDialogOpen, setIsRotateDialogOpen] = useState(false);
	const [secretToExpire, setSecretToExpire] = useState<{
		description: string | null;
		expiredAt: number | null;
		value: string;
	} | null>(null);
	const [successNotice, setSuccessNotice] = useState<
		"rotated" | "expired" | null
	>(null);
	const language = i18n.resolvedLanguage?.startsWith("fr") ? "fr-CA" : "en-CA";
	const notAvailable = t("common.notAvailable");
	const rotationErrorLinks: Record<string, string> = {};
	if (rotationReasonError) {
		rotationErrorLinks["#environment-rotation-reason-control"] =
			rotationReasonError;
	}
	if (operationError === "rotate") {
		rotationErrorLinks["#environment-rotation-form"] = t(
			"applicationEnvironmentManagement.rotateFailureTitle"
		);
	}

	const copyValue = async (
		value: string,
		successMessage: string
	): Promise<void> => {
		try {
			await globalThis.navigator.clipboard.writeText(value);
			toast.success(successMessage);
		} catch {
			return;
		}
	};

	const handleRevealSecret = async (): Promise<void> => {
		setOperationError(null);
		if (!permissions?.canRevealSecret) {
			return;
		}
		if (isSecretVisible) {
			setIsSecretVisible(false);
			return;
		}
		let currentCredentials = credentials;
		if (!currentCredentials) {
			try {
				currentCredentials = await getClientCredentials();
			} catch {
				setOperationError("retrieve");
				return;
			}
		}
		if (!currentCredentials.clientSecret) {
			return;
		}
		setIsSecretVisible(true);
	};

	const handleCopySecret = async (): Promise<void> => {
		setOperationError(null);
		if (!permissions?.canRevealSecret) {
			return;
		}
		let currentCredentials = credentials;
		if (!currentCredentials) {
			try {
				currentCredentials = await getClientCredentials();
			} catch {
				setOperationError("retrieve");
				return;
			}
		}
		if (currentCredentials.clientSecret) {
			await copyValue(
				currentCredentials.clientSecret,
				t("applicationEnvironmentManagement.clientSecretCopiedSuccess")
			);
		}
	};

	const handleRotationSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		setOperationError(null);
		if (!permissions?.canRotateSecret) {
			return;
		}
		if (!rotationReason.trim()) {
			setRotationReasonError(
				t("applicationEnvironmentManagement.rotationReasonRequired")
			);
			return;
		}
		setRotationReasonError("");
		setIsRotateDialogOpen(true);
	};

	const handleRotateSecret = async (): Promise<void> => {
		if (!permissions?.canRotateSecret) {
			return;
		}
		setSuccessNotice(null);
		try {
			await rotateSecret({
				description: rotationReason.trim(),
				rotatedSecretExpiredAt:
					Math.floor(Date.now() / 1000) +
					ROTATED_SECRET_EXPIRY_DAYS * 24 * 60 * 60,
			});
			setIsSecretVisible(false);
			setRotationReason("");
			setOperationError(null);
			setSuccessNotice("rotated");
			setIsRotateDialogOpen(false);
		} catch {
			setOperationError("rotate");
			setIsRotateDialogOpen(false);
			return;
		}
	};

	const handleExpireSecret = async (): Promise<void> => {
		if (!secretToExpire || !permissions?.canExpireRotatedSecrets) {
			return;
		}
		setSuccessNotice(null);
		try {
			await deleteRotatedSecret(secretToExpire.value);
			setSecretToExpire(null);
			setOperationError(null);
			setSuccessNotice("expired");
		} catch {
			setOperationError("expire");
			setSecretToExpire(null);
			return;
		}
	};

	return (
		<Grid columns="1fr" container="xl" tag="div">
			{isLoading ? (
				<>
					<Heading tag="h1">
						{t("applicationEnvironmentManagement.loadingTitle")}
					</Heading>
					<Notice
						noticeRole="info"
						noticeTitle={t("applicationEnvironmentManagement.loadingTitle")}
						noticeTitleTag="h2"
					>
						<Text>{t("applicationEnvironmentManagement.loadingBody")}</Text>
					</Notice>
				</>
			) : errorNotice || !environment ? (
				<>
					<Heading tag="h1">
						{t("applicationEnvironmentManagement.credentialsTitle")}
					</Heading>
					<Notice
						noticeRole={errorNotice?.noticeRole ?? "danger"}
						noticeTitleTag="h2"
						noticeTitle={
							errorNotice
								? t(errorNotice.titleKey as never)
								: t("applicationEnvironmentManagement.errorTitle")
						}
					>
						<Text>
							{errorNotice
								? (errorNotice.bodyText ?? t(errorNotice.bodyKey as never))
								: t("applicationEnvironmentManagement.errorBody")}
						</Text>
					</Notice>
				</>
			) : (
				<Grid columns="minmax(0, 46.5rem)" tag="div">
					<Grid alignItems="center" columns="auto auto 1fr" tag="div">
						<Text marginBottom="0">
							<strong>{applicationName}</strong>
						</Text>
						<div className="application-switch-icon">
							<Icon name="arrow-up-down" size="text" />
						</div>
						<Link href="/applications">
							{t("applicationEnvironments.switchApplication")}
						</Link>
					</Grid>
					<Heading tag="h1">{environment.partnerLabel}</Heading>
					{Object.keys(rotationErrorLinks).length > 0 ? (
						<ErrorSummary
							errorLinks={rotationErrorLinks}
							listen={false}
						/>
					) : null}
					<Text marginBottom="0">
						{t("applicationEnvironmentManagement.credentialsIntro")}
						<br />
						<br />
						{t("applicationEnvironmentManagement.credentialsLearnPrefix")}{" "}
						<Link href="#">
							{t("applicationEnvironmentManagement.credentialsLearnLink")}
						</Link>
						.
					</Text>
					<Tabs
						ariaLabel={t("applicationEnvironmentManagement.tabsLabel")}
						items={[
							{
								href: `/applications/${applicationUuid}/environments/${environmentUuid}`,
								label: t("applicationEnvironmentManagement.configurationTab"),
							},
							{
								active: true,
								href: `/applications/${applicationUuid}/environments/${environmentUuid}/credentials`,
								label: t("applicationEnvironmentManagement.credentialsTab"),
							},
						]}
					/>
					{isPublicClient ? (
						<Notice
							noticeRole="info"
							noticeTitleTag="h2"
							noticeTitle={t(
								"applicationEnvironmentManagement.publicClientCredentialsTitle"
							)}
						>
							<Text>
								{t(
									"applicationEnvironmentManagement.publicClientCredentialsBody"
								)}
							</Text>
						</Notice>
					) : isPrivateKeyJwt ? (
						<Grid columns="1fr" gap="300" tag="section">
							<Heading marginBottom="0" tag="h2">
								{t(
									"applicationEnvironmentManagement.currentCredentialsTitle"
								)}
							</Heading>
							<Grid columns="1fr" gap="150" tag="dl">
								<dt>
									<strong>
										{t(
											"applicationEnvironmentManagement.authenticationMethod"
										)}
									</strong>
								</dt>
								<dd>
									<div className="environment-credentials__value">
										<Text marginBottom="0">
											<code>private_key_jwt</code>
										</Text>
									</div>
								</dd>
								<dt>
									<strong>
										{t("applicationEnvironmentManagement.clientIdLabel")}
									</strong>
								</dt>
								<dd>
									<Text marginBottom="100" size="small">
										{t("applicationEnvironmentManagement.clientIdHelp")}
									</Text>
									<Grid
										columns="1fr"
										columnsDesktop="max-content max-content"
										gap="200"
										tag="div"
									>
										<div className="environment-credentials__value">
											<Text marginBottom="0">
												{environment.clientId ?? notAvailable}
											</Text>
										</div>
										<Button
											buttonRole="secondary"
											disabled={!environment.clientId}
											size="small"
											type="button"
											onGcdsClick={() => {
												if (environment.clientId) {
													void copyValue(
														environment.clientId,
														t(
															"applicationEnvironmentManagement.clientIdCopiedSuccess"
														)
													);
												}
											}}
										>
											{t("applicationEnvironmentManagement.copyAction")}
										</Button>
									</Grid>
								</dd>
								<dt>
									<strong>
										{t("applicationEnvironmentManagement.jwksUriLabel")}
									</strong>
								</dt>
								<dd>
									<Text marginBottom="100" size="small">
										{t(
											isProduction
												? "applicationEnvironmentManagement.productionJwksUriHelp"
												: "applicationEnvironmentManagement.jwksUriHelp"
										)}
									</Text>
									<div className="environment-credentials__value environment-credentials__value--jwks">
										<Text marginBottom="0">{jwksUri ?? notAvailable}</Text>
									</div>
									<Grid
										className="environment-credentials__actions"
										columns="max-content max-content"
										gap="200"
										tag="div"
									>
										<Button
											buttonRole="secondary"
											disabled={!jwksUri}
											size="small"
											type="button"
											onGcdsClick={() => {
												if (jwksUri) {
													void copyValue(
														jwksUri,
														t(
															"applicationEnvironmentManagement.jwksUriCopiedSuccess"
														)
													);
												}
											}}
										>
											{t("applicationEnvironmentManagement.copyAction")}
										</Button>
										{!isProduction ? (
											<Button
												buttonRole="secondary"
												size="small"
												type="button"
												onGcdsClick={() => {
													void navigate({
														to: "/applications/$applicationUuid/environments/$environmentUuid/authentication-method",
														params: { applicationUuid, environmentUuid },
													});
												}}
											>
												{t("applicationEnvironmentManagement.change")}
											</Button>
										) : null}
									</Grid>
								</dd>
							</Grid>
						</Grid>
					) : isLoadingPermissions ? (
						<Text>{t("applicationEnvironmentManagement.loadingRotatedSecrets")}</Text>
					) : permissionsError || !permissions ? (
						<Notice
							noticeRole="danger"
							noticeTitle={t("applicationEnvironmentManagement.errorTitle")}
							noticeTitleTag="h2"
						>
							<Text>{t("applicationEnvironmentManagement.errorBody")}</Text>
						</Notice>
					) : isClientSecretEnvironment ? (
						<>
							<Text marginBottom="0">
								<strong>
									{t("applicationEnvironmentManagement.credentialsSecurityTitle")}
								</strong>{" "}
								{t("applicationEnvironmentManagement.credentialsSecurityNote")}
							</Text>
							<Grid columns="1fr" gap="300" tag="section">
								<Heading marginBottom="0" tag="h2">
									{t(
										"applicationEnvironmentManagement.currentCredentialsTitle"
									)}
								</Heading>
								<Grid columns="1fr" gap="150" tag="dl">
									<dt>
										<strong>
											{t(
												"applicationEnvironmentManagement.authenticationMethod"
											)}
										</strong>
									</dt>
									<dd>
										<div className="environment-credentials__value">
											<Text marginBottom="0">
												<code>
													{environment.config?.clientAuthMethod ?? notAvailable}
												</code>
											</Text>
										</div>
									</dd>
									<dt>
										<strong>
											{t("applicationEnvironmentManagement.clientIdLabel")}
										</strong>
									</dt>
									<dd>
										<Text marginBottom="100" size="small">
											{t("applicationEnvironmentManagement.clientIdHelp")}
										</Text>
										<Grid
											columns="1fr"
											columnsDesktop="max-content max-content"
											gap="200"
											tag="div"
										>
											<div className="environment-credentials__value">
												<Text marginBottom="0">
													{environment.clientId ?? notAvailable}
												</Text>
											</div>
											<Button
												buttonRole="secondary"
												size="small"
												type="button"
												onGcdsClick={() => {
													if (environment.clientId) {
																void copyValue(
																	environment.clientId,
																	t(
																		"applicationEnvironmentManagement.clientIdCopiedSuccess"
																	)
																);
													}
												}}
											>
												{t("applicationEnvironmentManagement.copyAction")}
											</Button>
										</Grid>
									</dd>
									<dt>
										<strong>
											{t("applicationEnvironmentManagement.secretLabel")}
										</strong>
									</dt>
									<dd>
										{permissions.canRevealSecret ? (
										<Grid
											columns="1fr"
											columnsDesktop="max-content max-content max-content"
											gap="200"
											tag="div"
										>
											<div className="environment-credentials__value">
												<Text marginBottom="0">
													{isSecretVisible
														? (credentials?.clientSecret ?? notAvailable)
														: MASKED_SECRET}
												</Text>
											</div>
											<Button
												buttonRole="secondary"
												disabled={isLoadingClientCredentials}
												size="small"
												type="button"
												onGcdsClick={() => {
													void handleRevealSecret();
												}}
											>
												{isSecretVisible
													? t("applicationEnvironmentManagement.hideAction")
													: t("applicationEnvironmentManagement.revealAction")}
											</Button>
											<Button
												buttonRole="secondary"
												disabled={isLoadingClientCredentials}
												size="small"
												type="button"
												onGcdsClick={() => {
													void handleCopySecret();
												}}
											>
												{t("applicationEnvironmentManagement.copySecretAction")}
											</Button>
										</Grid>
										) : (
											<Grid columns="1fr" gap="150" tag="div">
												<Text marginBottom="0">
													{t(
														"applicationEnvironmentManagement.productionSecretAccessDenied"
													)}
												</Text>
												<Link href="/support">
													{t(
														"applicationEnvironmentManagement.productionSecretRequestAccess"
													)}
												</Link>
											</Grid>
										)}
									</dd>
								</Grid>
								{operationError === "retrieve" ? (
									<Grid columns="1fr 1fr" tag="div">
										<Alert
											alertRole="danger"
											container="full"
											heading={t(
												"applicationEnvironmentManagement.retrieveFailureTitle"
											)}
											onDismiss={() => {
												setOperationError(null);
											}}
										>
											<Text>
												{t(
													"applicationEnvironmentManagement.retrieveFailureBody"
												)}
											</Text>
										</Alert>
									</Grid>
								) : null}
							</Grid>
							<Grid columns="1fr" gap="300" tag="section">
								<Heading marginBottom="0" tag="h2">
									{t("applicationEnvironmentManagement.rotateSecretTitle")}
								</Heading>
								{isProduction ? (
									<Text marginBottom="0">
										{t(
											"applicationEnvironmentManagement.productionRotateSecretHelpPrefix"
										)}{" "}
										<Link href="/support">
											{t(
												"applicationEnvironmentManagement.productionSupportLink"
											)}
										</Link>
										.
									</Text>
								) : (
									<Text marginBottom="0">
										{t("applicationEnvironmentManagement.rotateSecretHelp")}
									</Text>
								)}
								{permissions.canRotateSecret ? (
									<>
								<form
									noValidate
									id="environment-rotation-form"
									onSubmit={handleRotationSubmit}
								>
									<Grid columns="1fr" gap="200" tag="div">
										<Input
											required
											errorMessage={rotationReasonError}
											id="environment-rotation-reason-control"
											inputId="environment-rotation-reason"
											name="rotation-reason"
											type="text"
											validateOn="other"
											value={rotationReason}
											hint={t(
												"applicationEnvironmentManagement.rotationReasonHint"
											)}
											label={t(
												"applicationEnvironmentManagement.rotationReasonLabel"
											)}
											onInput={(event): void => {
												setRotationReason(
													(event.target as HTMLInputElement).value
												);
												setRotationReasonError("");
											}}
										/>
										<Button
											buttonRole="primary"
											type="submit"
											disabled={
												isRotatingSecret || !permissions.canRotateSecret
											}
										>
											{t("applicationEnvironmentManagement.rotateSecretAction")}
										</Button>
									</Grid>
								</form>
								{operationError === "rotate" ? (
									<Grid columns="1fr 1fr" tag="div">
										<Alert
											alertRole="danger"
											container="full"
											heading={t(
												"applicationEnvironmentManagement.rotateFailureTitle"
											)}
											onDismiss={() => {
												setOperationError(null);
											}}
										>
											<Text>
												{t(
													"applicationEnvironmentManagement.rotateFailureBody"
												)}
											</Text>
										</Alert>
									</Grid>
								) : null}
								{successNotice === "rotated" ? (
									<Grid columns="1fr 1fr" tag="div">
										<Alert
											alertRole="success"
											container="full"
											heading={t(
												"applicationEnvironmentManagement.rotateSuccessTitle"
											)}
											onDismiss={() => { setSuccessNotice(null); }}
										/>
									</Grid>
								) : null}
									</>
								) : null}
							</Grid>
							<Grid columns="1fr" gap="300" tag="section">
								<Heading marginBottom="0" tag="h2">
									{t("applicationEnvironmentManagement.expiringSecretsTitle")}
								</Heading>
								{isProduction ? (
									<Text marginBottom="0">
										{t(
											"applicationEnvironmentManagement.productionExpiringSecretsHelpPrefix"
										)}{" "}
										<Link href="/support">
											{t(
												"applicationEnvironmentManagement.productionSupportLink"
											)}
										</Link>
										.
									</Text>
								) : (
									<Text marginBottom="0">
										{t("applicationEnvironmentManagement.expiringSecretsHelp")}
									</Text>
								)}
								{isLoadingRotatedSecrets ? (
									<Text>
										{t(
											"applicationEnvironmentManagement.loadingRotatedSecrets"
										)}
									</Text>
								) : rotatedSecrets.length > 0 ? (
									<ul className="environment-credentials__secret-list">
										{rotatedSecrets.map((secret, index) => {
											const deleteValue = secret.value;
											return (
												<li
													key={secret.secretId ?? deleteValue ?? index}
													className="environment-credentials__secret-item"
												>
														<Text marginBottom="0">
															<strong>
																{secret.description ?? notAvailable}
															</strong>
														</Text>
													<div className="environment-credentials__secret-details">
														<Text marginBottom="0">
															{t("applicationEnvironmentManagement.expiresAt", {
																date: formatExpiry(
																	secret.expiredAt,
																	language,
																	notAvailable
																	),
															})}
														</Text>
														{deleteValue && permissions.canExpireRotatedSecrets ? (
															<Button
																buttonRole="secondary"
																disabled={isDeletingRotatedSecret}
																size="small"
																type="button"
																onGcdsClick={() => {
																	setSecretToExpire({
																		description: secret.description,
																		expiredAt: secret.expiredAt,
																		value: deleteValue,
																	});
																}}
															>
																{t(
																	"applicationEnvironmentManagement.expireNowAction"
																)}
															</Button>
														) : null}
													</div>
												</li>
											);
										})}
									</ul>
								) : (
									<Text>
										{t("applicationEnvironmentManagement.noExpiringSecrets")}
									</Text>
								)}
								{operationError === "expire" ? (
									<Grid columns="1fr 1fr" tag="div">
										<Alert
											alertRole="danger"
											container="full"
											heading={t(
												"applicationEnvironmentManagement.expireFailureTitle"
											)}
											onDismiss={() => {
												setOperationError(null);
											}}
										>
											<Text>
												{t(
													"applicationEnvironmentManagement.expireFailureBody"
												)}
											</Text>
										</Alert>
									</Grid>
								) : null}
								{successNotice === "expired" ? (
									<Grid columns="1fr 1fr" tag="div">
										<Alert
											alertRole="success"
											container="full"
											heading={t(
												"applicationEnvironmentManagement.expireSuccessTitle"
											)}
											onDismiss={() => { setSuccessNotice(null); }}
										>
											<Text>
												{t("applicationEnvironmentManagement.expireSuccessBody")}
											</Text>
										</Alert>
									</Grid>
								) : null}
							</Grid>
						</>
					) : null}
				</Grid>
			)}
			{isRotateDialogOpen ? (
				<Modal
					description={t("applicationEnvironmentManagement.rotateConfirmBody")}
					footerAlignment="start"
					isOpen={isRotateDialogOpen}
					showCloseButton={false}
					showFooterDivider={false}
					title={t("applicationEnvironmentManagement.rotateConfirmTitle")}
					footer={
						<>
							<Button
								buttonRole="primary"
								disabled={isRotatingSecret}
								type="button"
								onGcdsClick={() => {
									void handleRotateSecret();
								}}
							>
								{t("applicationEnvironmentManagement.rotateSecretAction")}
							</Button>
							<Button
								buttonRole="secondary"
								disabled={isRotatingSecret}
								type="button"
								onGcdsClick={() => { setIsRotateDialogOpen(false); }}
							>
								{t("common.cancel")}
							</Button>
						</>
					}
					onClose={() => { setIsRotateDialogOpen(false); }}
				/>
			) : null}
			{secretToExpire ? (
				<Modal
					isOpen
					footerAlignment="start"
					showCloseButton={false}
					showFooterDivider={false}
					title={t("applicationEnvironmentManagement.expireConfirmTitle")}
					description={t("applicationEnvironmentManagement.expireConfirmBody", {
						expiry: formatExpiry(
							secretToExpire.expiredAt,
							language,
							notAvailable
						),
					})}
					footer={
						<>
							<Button
								buttonRole="danger"
								disabled={isDeletingRotatedSecret}
								type="button"
								onGcdsClick={() => {
									void handleExpireSecret();
								}}
							>
								{t("applicationEnvironmentManagement.expireSecretAction")}
							</Button>
							<Button
								buttonRole="secondary"
								disabled={isDeletingRotatedSecret}
								type="button"
								onGcdsClick={() => { setSecretToExpire(null); }}
							>
								{t("common.cancel")}
							</Button>
						</>
					}
					onClose={() => { setSecretToExpire(null); }}
				/>
			) : null}
		</Grid>
	);
};
