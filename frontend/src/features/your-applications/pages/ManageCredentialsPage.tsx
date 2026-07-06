import { useParams } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useToast } from "@/components/ui/Toast";
import {
	Button,
	ConfirmDialog,
	Grid,
	Heading,
	Notice,
	Text,
} from "@/components/ui";
import { HttpRequestError } from "@/fetch/errors";
import {
	createCurrentUserRPApplicationRotatedClientSecret,
	deleteCurrentUserRPApplicationRotatedClientSecret,
	getCurrentUserRPApplicationClientCredentials,
	getCurrentUserRPApplicationRotatedClientSecrets,
	type RPApplicationClientCredentialsRead,
	type RPApplicationRotatedSecretRead,
} from "@/fetch/rp-applications";

const maskedSecretPlaceholder = "********";
const ROTATION_EXPIRY_DAYS = 30;

type LabelValueRowProps = {
	label: string;
	value: ReactNode;
};

const getRotatedSecretDeleteValue = (
	secret: RPApplicationRotatedSecretRead
): string | null => {
	if (typeof secret.value === "string" && secret.value.length > 0) {
		return secret.value;
	}

	if (typeof secret.path === "string" && secret.path.length > 0) {
		return secret.path;
	}

	if (typeof secret.secretId === "string" && secret.secretId.length > 0) {
		return secret.secretId;
	}

	return null;
};

const LabelValueRow = ({ label, value }: LabelValueRowProps): ReactNode => (
	<div className="mb-300 last:mb-0">
		<Grid
			columns="1fr"
			columnsDesktop="12rem 1fr"
			columnsTablet="12rem 1fr"
			tag="div"
		>
			<Text marginBottom="0">
				<strong>{label}:</strong>
			</Text>
			<div>{value}</div>
		</Grid>
	</div>
);

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

	return new Date(epochSeconds * 1000).toLocaleDateString(language, {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
};

export const ManageCredentialsPage = (): FunctionComponent => {
	const { rpApplicationUuid } = useParams({
		from: "/your-applications/$rpApplicationUuid/manage-credentials",
	});
	const { i18n, t } = useTranslation();
	const toast = useToast();

	const [credentials, setCredentials] =
		useState<RPApplicationClientCredentialsRead | null>(null);
	const [rotatedSecrets, setRotatedSecrets] = useState<
		Array<RPApplicationRotatedSecretRead>
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSecretVisible, setIsSecretVisible] = useState(false);
	const [visibleRotatedSecrets, setVisibleRotatedSecrets] = useState<
		Set<string>
	>(new Set());
	const [isGeneratingSecret, setIsGeneratingSecret] = useState(false);
	const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = useState(false);
	const [isDeletingRotatedSecret, setIsDeletingRotatedSecret] = useState(false);
	const [deleteSecretId, setDeleteSecretId] = useState<string | null>(null);
	const lang = i18n.resolvedLanguage?.startsWith("fr") ? "fr" : "en";

	useEffect((): (() => void) => {
		let isMounted = true;

		const loadClientData = async (): Promise<void> => {
			try {
				const [credentialsResponse, rotatedSecretsResponse] = await Promise.all(
					[
						getCurrentUserRPApplicationClientCredentials(rpApplicationUuid),
						getCurrentUserRPApplicationRotatedClientSecrets(rpApplicationUuid),
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

				globalThis.location.replace("/error?kind=unexpected");
			}
		};

		void loadClientData();

		return () => {
			isMounted = false;
		};
	}, [rpApplicationUuid]);

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

	const handleGenerateNewSecret = async (): Promise<void> => {
		const expiresAt = getDefaultRotationExpiryEpochSeconds();
		const name = `Expires: ${formatEpochForDisplay(expiresAt, lang, "")}`;
		setIsGeneratingSecret(true);
		try {
			const nextRotatedSecrets =
				await createCurrentUserRPApplicationRotatedClientSecret(
					rpApplicationUuid,
					{
						description: name,
						rotatedSecretExpiredAt: expiresAt,
					}
				);
			const nextCredentials =
				await getCurrentUserRPApplicationClientCredentials(rpApplicationUuid);
			setRotatedSecrets(nextRotatedSecrets);
			setCredentials(nextCredentials);
			setIsSecretVisible(false);
			toast.success(t("workspaces.applicationRotateSecretSuccess"));
		} catch {
			globalThis.location.replace("/error?kind=unexpected");
		} finally {
			setIsGeneratingSecret(false);
			setIsGenerateConfirmOpen(false);
		}
	};

	const handleDeleteRotatedSecret = async (): Promise<void> => {
		if (!deleteSecretId) {
			return;
		}

		const deleteValue =
			rotatedSecrets
				.map((secret) => getRotatedSecretDeleteValue(secret))
				.find((value) => value === deleteSecretId) ?? deleteSecretId;

		setIsDeletingRotatedSecret(true);
		try {
			await deleteCurrentUserRPApplicationRotatedClientSecret(
				rpApplicationUuid,
				deleteValue
			);
			setRotatedSecrets((current) =>
				current.filter(
					(secret) => getRotatedSecretDeleteValue(secret) !== deleteValue
				)
			);
			setVisibleRotatedSecrets((current) => {
				const next = new Set(current);
				next.delete(deleteValue);
				return next;
			});
			toast.success(t("workspaces.applicationClientDeletedSuccess"));
		} catch {
			globalThis.location.replace("/error?kind=unexpected");
		} finally {
			setDeleteSecretId(null);
			setIsDeletingRotatedSecret(false);
		}
	};

	if (isLoading) {
		return (
			<>
				<Heading tag="h1">{t("workspaces.manageCredentials")}</Heading>
				<Notice
					noticeRole="info"
					noticeTitle={t("workspaces.applicationClientLoadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.applicationClientLoadingBody")}</Text>
				</Notice>
			</>
		);
	}

	if (!credentials) {
		return null;
	}

	return (
		<>
			<Heading tag="h1">{t("workspaces.manageCredentials")}</Heading>
			<Text>{t("workspaces.applicationClientHelp")}</Text>

			<Heading marginTop="0" tag="h2">
				{t("workspaces.clientCredentials")}
			</Heading>
			<LabelValueRow
				label={t("workspaces.applicationClientIdLabel")}
				value={
					<div className="flex flex-wrap items-center gap-150">
						<Text marginBottom="0">{credentials.clientId}</Text>
						<Button
							buttonRole="secondary"
							size="small"
							type="button"
							onGcdsClick={() => {
								void copyValue(
									credentials.clientId,
									t("workspaces.applicationClientIdCopiedSuccess")
								);
							}}
						>
							{t("workspaces.applicationClientCopyAction")}
						</Button>
					</div>
				}
			/>
			<Heading tag="h3">
				{t("workspaces.applicationClientActivateTitle")}
			</Heading>
			<div className="flex flex-col gap-200">
				<LabelValueRow
					label={t("workspaces.applicationClientNoExpiry")}
					value={
						<div className="flex flex-wrap items-center gap-150">
							<Text marginBottom="0">
								{isSecretVisible
									? (credentials.clientSecret ??
										t("workspaces.applicationClientSecretUnavailable"))
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
									? t("workspaces.applicationClientHideAction")
									: t("workspaces.applicationClientRevealAction")}
							</Button>
							{credentials.clientSecret ? (
								<Button
									buttonRole="secondary"
									size="small"
									type="button"
									onGcdsClick={() => {
										void copyValue(
											credentials.clientSecret ?? "",
											t("workspaces.applicationClientCopiedSuccess")
										);
									}}
								>
									{t("workspaces.applicationClientCopyAction")}
								</Button>
							) : null}
						</div>
					}
				/>
				{rotatedSecrets.map((secret) => {
					const deleteValue = getRotatedSecretDeleteValue(secret);
					if (!deleteValue) {
						return null;
					}
					const isVisible = visibleRotatedSecrets.has(deleteValue);
					return (
						<LabelValueRow
							key={deleteValue}
							label={
								secret.description?.trim() || t("rpOAuthSetup.notAvailable")
							}
							value={
								<div className="flex flex-wrap items-center gap-150">
									<Text marginBottom="0">
										{isVisible
											? (secret.value ??
												t("workspaces.applicationClientSecretUnavailable"))
											: maskedSecretPlaceholder}
									</Text>
									<Button
										buttonRole="secondary"
										size="small"
										type="button"
										onGcdsClick={() => {
											setVisibleRotatedSecrets((current) => {
												const next = new Set(current);
												if (isVisible) {
													next.delete(deleteValue);
												} else {
													next.add(deleteValue);
												}
												return next;
											});
										}}
									>
										{isVisible
											? t("workspaces.applicationClientHideAction")
											: t("workspaces.applicationClientRevealAction")}
									</Button>
									{secret.value ? (
										<Button
											buttonRole="secondary"
											size="small"
											type="button"
											onGcdsClick={() => {
												void copyValue(
													secret.value ?? "",
													t("workspaces.applicationClientCopiedSuccess")
												);
											}}
										>
											{t("workspaces.applicationClientCopyAction")}
										</Button>
									) : null}
									<Button
										buttonRole="danger"
										size="small"
										type="button"
										onGcdsClick={() => {
											setDeleteSecretId(deleteValue);
										}}
									>
										{t("workspaces.applicationClientDeleteAction")}
									</Button>
								</div>
							}
						/>
					);
				})}
			</div>
			<div>
				<Button
					disabled={isGeneratingSecret}
					type="button"
					onGcdsClick={() => {
						setIsGenerateConfirmOpen(true);
					}}
				>
					{t("workspaces.applicationClientGenerateAction")}
				</Button>
			</div>

			<ConfirmDialog
				cancelLabel={t("common.cancel")}
				confirmLabel={t("workspaces.applicationClientGenerateConfirmAction")}
				description={t("workspaces.applicationClientGenerateConfirmBody")}
				isOpen={isGenerateConfirmOpen}
				isPending={isGeneratingSecret}
				title={t("workspaces.applicationClientGenerateConfirmTitle")}
				onClose={() => {
					setIsGenerateConfirmOpen(false);
				}}
				onConfirm={() => {
					void handleGenerateNewSecret();
				}}
			/>

			<ConfirmDialog
				cancelLabel={t("common.cancel")}
				confirmLabel={t("workspaces.applicationClientDeleteConfirmAction")}
				description={t("workspaces.applicationClientDeleteConfirmBody")}
				isOpen={deleteSecretId !== null}
				isPending={isDeletingRotatedSecret}
				title={t("workspaces.applicationClientDeleteConfirmTitle")}
				onClose={() => {
					setDeleteSecretId(null);
				}}
				onConfirm={() => {
					void handleDeleteRotatedSecret();
				}}
			/>
		</>
	);
};
