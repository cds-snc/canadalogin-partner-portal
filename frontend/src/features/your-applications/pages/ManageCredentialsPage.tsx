import { useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useToast } from "@/components/ui/Toast";
import {
	Button,
	Checkboxes,
	ConfirmDialog,
	Container,
	Grid,
	Heading,
	Input,
	Notice,
	Text,
} from "@/components/ui";
import { HttpRequestError } from "@/fetch/errors";
import {
	createAccessibleRPApplicationRotatedClientSecret,
	deleteAccessibleRPApplicationRotatedClientSecret,
	getAccessibleRPApplicationClientCredentials,
	getAccessibleRPApplicationRotatedClientSecrets,
	getApplicationRPConfiguration,
	rotateAccessibleRPApplicationClientSecret,
	type ApplicationRPConfigurationSummaryRead,
	type RPApplicationClientCredentialsRead,
	type RPApplicationRotatedSecretRead,
} from "@/fetch/rp-applications";

const maskedSecretPlaceholder = "********";
const ROTATION_EXPIRY_DAYS = 30;

type RotatedSecretCheckboxOption = {
	hint: string;
	id: string;
	label: string;
	value: string;
};

const getRotatedSecretId = (
	secret: RPApplicationRotatedSecretRead
): string | null => {
	if (typeof secret.secretId === "string" && secret.secretId.length > 0) {
		return secret.secretId;
	}

	return null;
};

const getDefaultRotationExpiryEpochSeconds = (): number =>
	Math.floor(Date.now() / 1000) + ROTATION_EXPIRY_DAYS * 24 * 60 * 60;

const formatEpochForDisplay = (
	epochSeconds: number | null | undefined,
	language: string,
	fallback: string
): string => {
	if (typeof epochSeconds !== "number") {
		return fallback;
	}

	return new Date(epochSeconds * 1000).toLocaleString(language, {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
};

export const ManageCredentialsPage = (): FunctionComponent => {
	const params = useParams({ strict: false });
	const applicationInformationUuid = params["applicationInformationUuid"] ?? "";
	const rpApplicationUuid =
		params["rpConfigurationUuid"] || params["rpApplicationUuid"] || "";
	const workspaceUuid = params["workspaceUuid"] ?? "";
	const { i18n, t } = useTranslation();
	const toast = useToast();

	const [application, setApplication] =
		useState<ApplicationRPConfigurationSummaryRead | null>(null);
	const [credentials, setCredentials] =
		useState<RPApplicationClientCredentialsRead | null>(null);
	const [rotatedSecrets, setRotatedSecrets] = useState<
		Array<RPApplicationRotatedSecretRead>
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<Error | null>(null);
	const [operationError, setOperationError] = useState<string | null>(null);
	const [isSecretVisible, setIsSecretVisible] = useState(false);
	const [rotationName, setRotationName] = useState("");
	const [rotationError, setRotationError] = useState<string | null>(null);
	const [isCreateRotationConfirmOpen, setIsCreateRotationConfirmOpen] =
		useState(false);
	const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false);
	const [isRegenerating, setIsRegenerating] = useState(false);
	const [isCreatingRotation, setIsCreatingRotation] = useState(false);
	const [isDeletingRotatedSecret, setIsDeletingRotatedSecret] = useState(false);
	const [selectedSecretId, setSelectedSecretId] = useState<string | null>(null);
	const [deleteSecretId, setDeleteSecretId] = useState<string | null>(null);
	const lang = i18n.resolvedLanguage?.startsWith("fr") ? "fr" : "en";

	useEffect((): (() => void) => {
		let isMounted = true;

		const loadClientData = async (): Promise<void> => {
			try {
				const applicationResponse = await getApplicationRPConfiguration(
					workspaceUuid,
					applicationInformationUuid,
					rpApplicationUuid
				);
				if (!isMounted) {
					return;
				}
				setApplication(applicationResponse);

				const [credentialsResponse, rotatedSecretsResponse] = await Promise.all(
					[
						getAccessibleRPApplicationClientCredentials(
							rpApplicationUuid,
							workspaceUuid,
							applicationInformationUuid
						),
						getAccessibleRPApplicationRotatedClientSecrets(
							rpApplicationUuid,
							workspaceUuid,
							applicationInformationUuid
						),
					]
				);
				if (!isMounted) {
					return;
				}

				setCredentials(credentialsResponse);
				setRotatedSecrets(rotatedSecretsResponse);
				setIsLoading(false);
			} catch (error) {
				if (!isMounted) {
					return;
				}

				if (error instanceof HttpRequestError && error.status === 403) {
					globalThis.location.replace("/access-denied");
					return;
				}
				if (error instanceof HttpRequestError && error.status === 404) {
					globalThis.location.replace("/error?kind=not_found");
					return;
				}

				setLoadError(error as Error);
				setIsLoading(false);
			}
		};

		void loadClientData();

		return () => {
			isMounted = false;
		};
	}, [applicationInformationUuid, rpApplicationUuid, workspaceUuid]);

	const rotatedSecretCheckboxOptions = useMemo<
		Array<RotatedSecretCheckboxOption>
	>(
		() =>
			rotatedSecrets
				.map((secret) => {
					const secretId = getRotatedSecretId(secret);
					if (!secretId) {
						return null;
					}

					return {
						hint: `${t("manageCredentials.applicationClientRotatedSecretsExpiresHeader")}: ${formatEpochForDisplay(
							secret.expiredAt,
							lang,
							t("common.notAvailable")
						)}`,
						id: secretId,
						label: secret.description?.trim() || t("common.notAvailable"),
						value: secretId,
					};
				})
				.filter(
					(option): option is RotatedSecretCheckboxOption => option !== null
				),
		[lang, rotatedSecrets, t]
	);

	const copyValue = async (
		value: string,
		successMessage: string
	): Promise<void> => {
		if (!globalThis.navigator?.clipboard?.writeText) {
			return;
		}

		await globalThis.navigator.clipboard.writeText(value);
		toast.success(successMessage);
	};

	const handleRegenerateSecret = async (): Promise<void> => {
		setIsRegenerating(true);
		setOperationError(null);
		try {
			const nextCredentials = await rotateAccessibleRPApplicationClientSecret(
				rpApplicationUuid,
				undefined,
				workspaceUuid,
				applicationInformationUuid
			);
			setCredentials(nextCredentials);
			setIsSecretVisible(true);
			toast.success(t("manageCredentials.applicationRotateSecretSuccess"));
			setIsRegenerateConfirmOpen(false);
		} catch {
			setOperationError(t("manageCredentials.applicationClientOperationError"));
		} finally {
			setIsRegenerating(false);
		}
	};

	const handleCreateRotation = async (): Promise<void> => {
		const normalizedName = rotationName.trim();
		setIsCreatingRotation(true);
		setOperationError(null);
		try {
			const expiresAt = getDefaultRotationExpiryEpochSeconds();
			const nextRotatedSecrets =
				await createAccessibleRPApplicationRotatedClientSecret(
					rpApplicationUuid,
					{
						description: normalizedName,
						rotatedSecretExpiredAt: expiresAt,
					},
					workspaceUuid,
					applicationInformationUuid
				);
			const nextCredentials = await getAccessibleRPApplicationClientCredentials(
				rpApplicationUuid,
				workspaceUuid,
				applicationInformationUuid
			);
			setRotatedSecrets(nextRotatedSecrets);
			setCredentials(nextCredentials);
			setIsSecretVisible(false);
			setRotationName("");
			toast.success(t("manageCredentials.applicationRotateSecretSuccess"));
		} catch {
			setOperationError(t("manageCredentials.applicationClientOperationError"));
		} finally {
			setIsCreatingRotation(false);
			setIsCreateRotationConfirmOpen(false);
		}
	};

	const handleRotationFormSubmit = (event: Event): void => {
		event.preventDefault();

		const normalizedName = rotationName.trim();
		if (!normalizedName) {
			setRotationError(t("manageCredentials.applicationClientRotateNameLabel"));
			return;
		}

		setRotationError(null);
		setIsCreateRotationConfirmOpen(true);
	};

	const handleDeleteRotatedSecret = async (): Promise<void> => {
		if (!deleteSecretId) {
			return;
		}

		setIsDeletingRotatedSecret(true);
		setOperationError(null);
		try {
			await deleteAccessibleRPApplicationRotatedClientSecret(
				rpApplicationUuid,
				deleteSecretId,
				workspaceUuid,
				applicationInformationUuid
			);
			setRotatedSecrets((current) =>
				current.filter(
					(secret) => getRotatedSecretId(secret) !== deleteSecretId
				)
			);
			setSelectedSecretId((current) =>
				current === deleteSecretId ? null : current
			);
			toast.success(t("manageCredentials.applicationClientDeletedSuccess"));
		} catch {
			setOperationError(t("manageCredentials.applicationClientOperationError"));
		} finally {
			setDeleteSecretId(null);
			setIsDeletingRotatedSecret(false);
		}
	};

	if (isLoading) {
		return (
			<>
				<Heading tag="h1">{t("manageCredentials.clientCredentials")}</Heading>
				<Notice
					noticeRole="info"
					noticeTitle={t("manageCredentials.applicationClientLoadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("manageCredentials.applicationClientLoadingBody")}</Text>
				</Notice>
			</>
		);
	}

	const applicationName = application
		? application.configurationName?.trim() ||
			(lang === "fr" ? application.serviceNameFr : application.serviceNameEn)
		: t("manageCredentials.clientCredentials");
	const parentPath = `/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/rp-configurations/${rpApplicationUuid}`;

	if (loadError) {
		return (
			<Grid columns="1fr" tag="div">
				<Heading tag="h1">{applicationName}</Heading>
				<Notice
					noticeRole="danger"
					noticeTitle={t("manageCredentials.applicationClientUnavailableTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("manageCredentials.applicationClientUnavailableBody")}</Text>
				</Notice>
				<Button href={parentPath} type="link">
					{t("manageCredentials.applicationClientBackAction")}
				</Button>
			</Grid>
		);
	}

	if (!application || !credentials) {
		return null;
	}

	return (
		<Grid columns="1fr" tag="div">
			<Heading marginBottom="0" tag="h1">
				{applicationName}
			</Heading>

			<Text>{t("manageCredentials.applicationClientHelp")}</Text>

			{operationError ? (
				<Notice
					noticeRole="danger"
					noticeTitleTag="h2"
					noticeTitle={t(
						"manageCredentials.applicationClientOperationErrorTitle"
					)}
				>
					<Text>{operationError}</Text>
				</Notice>
			) : null}

			<Container id="rp-application-client-credentials" tag="section">
				<Heading marginTop="0" tag="h2">
					{t("manageCredentials.clientCredentials")}
				</Heading>
				<Grid
					columns="1fr"
					columnsDesktop="12rem 1fr"
					columnsTablet="12rem 1fr"
					tag="dl"
				>
					<dt>
						<strong>{t("manageCredentials.applicationClientIdLabel")}:</strong>
					</dt>
					<dd>
						<div className="flex flex-wrap items-center gap-150">
							<Text marginBottom="0">{credentials.clientId}</Text>
							<Button
								buttonRole="secondary"
								size="small"
								type="button"
								onGcdsClick={() => {
									void copyValue(
										credentials.clientId,
										t("manageCredentials.applicationClientIdCopiedSuccess")
									);
								}}
							>
								{t("manageCredentials.applicationClientCopyAction")}
							</Button>
						</div>
					</dd>
					<dt>
						<strong>
							{t("manageCredentials.applicationClientSecretLabel")}:
						</strong>
					</dt>
					<dd>
						<div className="flex flex-wrap items-center gap-150">
							<Text marginBottom="0">
								{isSecretVisible
									? (credentials.clientSecret ??
										t("manageCredentials.applicationClientSecretUnavailable"))
									: maskedSecretPlaceholder}
							</Text>
							<Button
								buttonRole="secondary"
								size="small"
								type="button"
								onGcdsClick={() => {
									setIsSecretVisible((current) => !current);
								}}
							>
								{isSecretVisible
									? t("manageCredentials.applicationClientHideAction")
									: t("manageCredentials.applicationClientRevealAction")}
							</Button>
							{credentials.clientSecret ? (
								<Button
									buttonRole="secondary"
									size="small"
									type="button"
									onGcdsClick={() => {
										void copyValue(
											credentials.clientSecret ?? "",
											t("manageCredentials.applicationClientCopiedSuccess")
										);
									}}
								>
									{t("manageCredentials.applicationClientCopyAction")}
								</Button>
							) : null}
							<Button
								buttonRole="danger"
								disabled={isRegenerating}
								size="small"
								type="button"
								onGcdsClick={() => {
									setIsRegenerateConfirmOpen(true);
								}}
							>
								{t("manageCredentials.applicationClientRotateOptionRegenerate")}
							</Button>
						</div>
					</dd>
				</Grid>
			</Container>

			<Container id="rp-application-client-rotation" tag="section">
				<Heading marginTop="0" tag="h2">
					{t("manageCredentials.applicationClientRotateSectionTitle")}
				</Heading>
				<Text>{t("manageCredentials.applicationClientRotateSectionHelp")}</Text>
				<form
					className="mt-300 flex flex-col gap-300"
					onSubmit={(event) => {
						handleRotationFormSubmit(event.nativeEvent);
					}}
				>
					<Input
						required
						hint={t("manageCredentials.applicationClientRotateNameHint")}
						inputId="client-rotation-name"
						label={t("manageCredentials.applicationClientRotateNameLabel")}
						name="client-rotation-name"
						type="text"
						value={rotationName}
						onInput={(event): void => {
							setRotationName((event.target as HTMLInputElement).value);
							if (rotationError) {
								setRotationError(null);
							}
						}}
					/>
					{rotationError ? (
						<p className="text-sm text-[var(--gcds-text-danger)]">
							{rotationError}
						</p>
					) : null}
					<div>
						<Button
							buttonRole="danger"
							disabled={isCreatingRotation}
							type="submit"
						>
							{t("manageCredentials.applicationClientRotateAddAction")}
						</Button>
					</div>
				</form>
			</Container>

			{rotatedSecretCheckboxOptions.length > 0 ? (
				<Container id="rp-application-rotated-secrets" tag="section">
					<Heading marginTop="0" tag="h2">
						{t("manageCredentials.applicationClientRotatedSecretsTitle")}
					</Heading>
					<>
						<Checkboxes
							hideLegend
							name="rotated-secret-selection"
							options={rotatedSecretCheckboxOptions}
							value={selectedSecretId ? [selectedSecretId] : []}
							legend={t(
								"manageCredentials.applicationClientRotatedSecretsTitle"
							)}
							onInput={(event): void => {
								setSelectedSecretId(
									event.target.value[event.target.value.length - 1] ?? null
								);
							}}
						/>
						<div className="mt-300">
							<Button
								buttonRole="danger"
								disabled={selectedSecretId === null}
								type="button"
								onGcdsClick={() => {
									if (selectedSecretId) {
										setDeleteSecretId(selectedSecretId);
									}
								}}
							>
								{t("manageCredentials.applicationClientDeleteAction")}
							</Button>
						</div>
					</>
				</Container>
			) : null}

			<ConfirmDialog
				cancelLabel={t("common.cancel")}
				description={t("manageCredentials.applicationClientRotateConfirmBody")}
				isOpen={isCreateRotationConfirmOpen}
				isPending={isCreatingRotation}
				title={t("manageCredentials.applicationClientRotateConfirmTitle")}
				confirmLabel={t(
					"manageCredentials.applicationClientRotateConfirmAction"
				)}
				onClose={() => {
					setIsCreateRotationConfirmOpen(false);
				}}
				onConfirm={() => {
					void handleCreateRotation();
				}}
			/>

			<ConfirmDialog
				cancelLabel={t("common.cancel")}
				isOpen={isRegenerateConfirmOpen}
				isPending={isRegenerating}
				title={t("manageCredentials.applicationClientRegenerateConfirmTitle")}
				confirmLabel={t(
					"manageCredentials.applicationClientRegenerateConfirmAction"
				)}
				description={t(
					"manageCredentials.applicationClientRegenerateConfirmBody"
				)}
				onClose={() => {
					setIsRegenerateConfirmOpen(false);
				}}
				onConfirm={() => {
					void handleRegenerateSecret();
				}}
			/>

			<ConfirmDialog
				cancelLabel={t("common.cancel")}
				confirmLabel={t("common.delete")}
				description={t("manageCredentials.applicationClientDeleteConfirmBody")}
				isOpen={deleteSecretId !== null}
				isPending={isDeletingRotatedSecret}
				title={t("manageCredentials.applicationClientDeleteConfirmTitle")}
				onClose={() => {
					setDeleteSecretId(null);
				}}
				onConfirm={() => {
					void handleDeleteRotatedSecret();
				}}
			/>
		</Grid>
	);
};
