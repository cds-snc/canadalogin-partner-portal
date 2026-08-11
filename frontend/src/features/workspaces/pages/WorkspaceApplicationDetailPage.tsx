import { useState, type FormEvent } from "react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import {
	Button,
	ConfirmDialog,
	DateInput,
	Heading,
	Input,
	Link,
	Notice,
	Select,
	Text,
} from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useApplicationInformationContacts } from "../hooks/use-application-information-contacts";
import { useWorkspaceApplicationInformationList } from "../hooks/use-workspace-application-information";
import { useWorkspaceRPApplicationDeveloperInvitations } from "../hooks/use-workspace-rp-application-developer-invitations";
import { useWorkspaceRPApplicationManagement } from "../hooks/use-workspace-rp-application-management";
import { useWorkspaceRPApplication } from "../hooks/use-workspace-rp-applications";
import {
	getWorkspaceOnboardingStateLabel,
	getWorkspacePromotionStatusLabel,
} from "../onboarding-display";
import { getApplicationInformationReadinessSummary } from "../onboarding-readiness";

const readString = (
	payload: Record<string, unknown> | null | undefined,
	key: string
): string | null => {
	const value = payload?.[key];
	return typeof value === "string" && value.trim().length > 0 ? value : null;
};

const readStringArray = (
	payload: Record<string, unknown> | null | undefined,
	key: string
): Array<string> => {
	const value = payload?.[key];
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(
		(entry): entry is string =>
			typeof entry === "string" && entry.trim().length > 0
	);
};

type InvitationFormState = {
	inviteExpiresAt: string;
	invitedEmail: string;
	role: string;
};

type CreatedInvitationState = {
	acceptanceUrl: string;
	invitedEmail: string;
	role: string;
};

const RP_USER_EDIT_ROLE = "RP User (Edit)";

const getToday = (): string => new Date().toISOString().slice(0, 10);

const getDefaultInvitationExpiry = (): string => {
	const nextWeek = new Date();
	nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
	return nextWeek.toISOString().slice(0, 10);
};

const createEmptyInvitationForm = (): InvitationFormState => ({
	inviteExpiresAt: getDefaultInvitationExpiry(),
	invitedEmail: "",
	role: RP_USER_EDIT_ROLE,
});

const toInvitationExpiryTimestamp = (selectedDate: string): string => {
	const trimmedDate = selectedDate.trim();
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedDate);
	if (!match) {
		throw new Error("Invitation expiry must be in YYYY-MM-DD format");
	}

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const timestamp = Date.UTC(year, month - 1, day, 23, 59, 59, 999);
	const normalizedDate = new Date(timestamp);
	if (
		normalizedDate.getUTCFullYear() !== year ||
		normalizedDate.getUTCMonth() !== month - 1 ||
		normalizedDate.getUTCDate() !== day
	) {
		throw new Error("Invitation expiry must be a valid calendar date");
	}

	return normalizedDate.toISOString();
};

const getInvitationStatusLabel = (
	t: (
		key: string | Array<string>,
		options?: Record<string, unknown>
	) => string,
	status: string | null | undefined
): string => {
	switch ((status ?? "").trim().toLowerCase()) {
		case "accepted":
			return t("workspaces.applicationsInvitationStatusAccepted");
		case "expired":
			return t("workspaces.applicationsInvitationStatusExpired");
		case "pending":
			return t("workspaces.applicationsInvitationStatusPending");
		case "revoked":
			return t("workspaces.applicationsInvitationStatusRevoked");
		default:
			return status?.trim() || t("common.notAvailable");
	}
};

export const WorkspaceApplicationDetailPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const { rpApplicationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid",
	});
	const search = useSearch({
		from: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid",
	});
	const { application, error, isLoading } = useWorkspaceRPApplication(
		workspaceUuid,
		rpApplicationUuid
	);
	const { deleteRPApplication, isDeleting } =
		useWorkspaceRPApplicationManagement();
	const {
		createInvitation,
		error: invitationError,
		invitations,
		isCreating: isCreatingInvitation,
		isLoading: isLoadingInvitations,
		isRevoking: isRevokingInvitation,
		revokeInvitation,
	} = useWorkspaceRPApplicationDeveloperInvitations(
		workspaceUuid,
		rpApplicationUuid
	);
	const { applicationInformationRecords } =
		useWorkspaceApplicationInformationList(workspaceUuid);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [createdInvitation, setCreatedInvitation] =
		useState<CreatedInvitationState | null>(null);
	const [invitationForm, setInvitationForm] =
		useState<InvitationFormState>(createEmptyInvitationForm);
	const [invitationLocalError, setInvitationLocalError] =
		useState<Error | null>(null);
	const [localError, setLocalError] = useState<Error | null>(null);
	const linkedApplicationInformation =
		!application?.application_information_id
			? null
			: (applicationInformationRecords.find(
					(applicationInformation) =>
						applicationInformation.id ===
						application.application_information_id
			  ) ?? null);
	const {
		contacts: linkedApplicationInformationContacts,
		error: linkedContactsError,
		isLoading: isLoadingLinkedContacts,
	} = useApplicationInformationContacts(
		workspaceUuid,
		linkedApplicationInformation?.uuid ?? ""
	);
	const linkedReadinessSummary =
		linkedApplicationInformation && !isLoadingLinkedContacts
			? getApplicationInformationReadinessSummary(
					linkedApplicationInformation,
					linkedApplicationInformationContacts
				)
			: null;
	const isProductionBound =
		(application?.canada_login_environment?.trim().toLowerCase() ?? "") ===
			"production" ||
		(application?.promotion_requested_at?.trim().length ?? 0) > 0 ||
		(application?.promotion_status?.trim().length ?? 0) > 0;
	const showLinkedReadinessWarning =
		isProductionBound &&
		(linkedApplicationInformation === null ||
			(linkedReadinessSummary !== null && !linkedReadinessSummary.submitReady));
	const errorNotice = getRequestErrorNotice(localError ?? error ?? linkedContactsError, {
		bodyKey: "workspaces.applicationsErrorBody",
		titleKey: "workspaces.applicationsErrorTitle",
	});
	const invitationErrorNotice = getRequestErrorNotice(
		invitationLocalError ?? invitationError,
		{
			bodyKey: "workspaces.applicationsInvitationErrorBody",
			titleKey: "workspaces.applicationsInvitationErrorTitle",
		}
	);
	const registrationPayload =
		(application?.oidc_registration_payload as Record<
			string,
			unknown
		> | null) ?? null;
	const applicationUrlEn = readString(
		registrationPayload,
		"application_environment_url_en"
	);
	const applicationUrlFr = readString(
		registrationPayload,
		"application_environment_url_fr"
	);
	const redirectUris = readStringArray(registrationPayload, "redirect_uris");
	const owners = application?.application_owner?.owners ?? [];
	const successMessage =
		search.created === "1"
			? t("workspaces.applicationsCreatedSuccess")
			: search.updated === "1"
				? t("workspaces.applicationsUpdatedSuccess")
				: null;

	const handleCreateInvitation = async (
		event: FormEvent<HTMLFormElement>
	): Promise<void> => {
		event.preventDefault();
		setCreatedInvitation(null);
		setInvitationLocalError(null);

		try {
			const created = await createInvitation({
				inviteExpiresAt: toInvitationExpiryTimestamp(
					invitationForm.inviteExpiresAt
				),
				invitedEmail: invitationForm.invitedEmail.trim(),
				role: invitationForm.role,
			});
			setCreatedInvitation({
				acceptanceUrl: created.acceptanceUrl,
				invitedEmail: created.invitedEmail,
				role: created.role,
			});
			setInvitationForm(createEmptyInvitationForm());
		} catch (requestError) {
			setInvitationLocalError(requestError as Error);
		}
	};

	const handleRevokeInvitation = async (
		invitationUuid: string
	): Promise<void> => {
		setInvitationLocalError(null);

		try {
			await revokeInvitation(invitationUuid);
		} catch (requestError) {
			setInvitationLocalError(requestError as Error);
		}
	};

	const handleDeleteApplication = async (): Promise<void> => {
		setLocalError(null);

		try {
			await deleteRPApplication(workspaceUuid, rpApplicationUuid);

			await navigate({
				params: { workspaceUuid },
				replace: true,
				search: { deleted: "1" },
				to: "/workspaces/$workspaceUuid/applications",
			});
		} catch (requestError) {
			setDeleteDialogOpen(false);
			setLocalError(requestError as Error);
		}
	};

	return (
		<>
			<Heading tag="h1">
				{application
					? t("workspaces.applicationsDetailTitle", {
							name: application.dnr_app_name,
						})
					: t("workspaces.applicationsSectionTitle")}
			</Heading>
			<Text>{t("workspaces.applicationsDetailSummary")}</Text>

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
					noticeTitle={t(errorNotice.titleKey)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey)}</Text>
				</Notice>
			) : null}

			{application ? (
				<div className="grid gap-300">
					{showLinkedReadinessWarning ? (
						<Notice
							noticeRole="warning"
							noticeTitleTag="h2"
							noticeTitle={
								linkedApplicationInformation
									? t(
											"workspaces.applicationsProductionReadinessWarningTitle"
									  )
									: t(
											"workspaces.applicationsProductionLinkInfoWarningTitle"
									  )
							}
						>
							<Text>
								{linkedApplicationInformation
									? t(
											"workspaces.applicationsProductionReadinessWarningBody"
									  )
									: t(
											"workspaces.applicationsProductionLinkInfoWarningBody"
									  )}
							</Text>
						</Notice>
					) : null}

					{isProductionBound ? (
						<Notice
							noticeRole="info"
							noticeTitleTag="h2"
							noticeTitle={t(
								"workspaces.applicationsProductionReadinessInfoTitle"
							)}
						>
							<Text>
								{t(
									"workspaces.applicationsProductionReadinessInfoBody"
								)}
							</Text>
						</Notice>
					) : null}

					<Heading tag="h2">{t("workspaces.applicationsSectionTitle")}</Heading>
					<Text>{`${t("workspaces.applicationsEnvironmentLabel")}: ${application.canada_login_environment ?? t("common.notAvailable")}`}</Text>
					<Text>{`${t("workspaces.applicationsStatusLabel")}: ${application.status ?? t("common.notAvailable")}`}</Text>
					<Text>
						{`${t("workspaces.onboardingStateLabel")}: ${application.onboarding_state?.trim() ? getWorkspaceOnboardingStateLabel(t, application.onboarding_state) : t("common.notAvailable")}`}
					</Text>
					<Text>
						{`${t("workspaces.productionReviewLabel")}: ${application.promotion_status?.trim() ? getWorkspacePromotionStatusLabel(t, application.promotion_status) : t("common.notAvailable")}`}
					</Text>
					<Text>{`${t("workspaces.applicationsIbmIdLabel")}: ${application.ibm_sv_application_id ?? t("common.notAvailable")}`}</Text>
					<Text>
						{`${t("workspaces.applicationsLinkedInfoLabel")}: ${linkedApplicationInformation?.serviceNameEn ?? t("workspaces.applicationsNoLinkedInfo")}`}
					</Text>
					<Text>
						{`${t("workspaces.applicationsOwnersLabel")}: ${owners.length > 0 ? owners.map((owner) => owner.email).join(", ") : t("common.notAvailable")}`}
					</Text>
					<Text>{`${t("workspaces.submittedAtLabel")}: ${application.submitted_at ?? t("common.notAvailable")}`}</Text>
					<Text>{`${t("workspaces.underReviewAtLabel")}: ${application.under_review_at ?? t("common.notAvailable")}`}</Text>
					<Text>{`${t("workspaces.approvedAtLabel")}: ${application.approved_at ?? t("common.notAvailable")}`}</Text>
					<Text>{`${t("workspaces.launchedAtLabel")}: ${application.launched_at ?? t("common.notAvailable")}`}</Text>
					<Text>{`${t("workspaces.applicationsCreatedAtLabel")}: ${application.created_at}`}</Text>

					{applicationUrlEn ? (
						<Text>{`${t("workspaces.applicationsUrlEnLabel")}: ${applicationUrlEn}`}</Text>
					) : null}
					{applicationUrlFr ? (
						<Text>{`${t("workspaces.applicationsUrlFrLabel")}: ${applicationUrlFr}`}</Text>
					) : null}
					<div>
						<Heading tag="h2">
							{t("workspaces.applicationsRedirectUrisLabel")}
						</Heading>
						{redirectUris.length > 0 ? (
							<ul className="list-disc pl-300">
								{redirectUris.map((redirectUri) => (
									<li key={redirectUri}>{redirectUri}</li>
								))}
							</ul>
						) : (
							<Text>{t("workspaces.applicationsNoRedirectUris")}</Text>
						)}
					</div>

					<div className="grid gap-200 rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300">
						<Heading tag="h2">
							{t("workspaces.applicationsInvitationsTitle")}
						</Heading>
						<Text>{t("workspaces.applicationsInvitationsSummary")}</Text>
						<Text>
							{t("workspaces.applicationsInvitationsDeliveryNotice")}
						</Text>

						{createdInvitation ? (
							<Notice
								noticeRole="success"
								noticeTitleTag="h3"
								noticeTitle={t(
									"workspaces.applicationsInvitationCreatedTitle"
								)}
							>
								<Text>
									{t("workspaces.applicationsInvitationCreatedBody", {
										email: createdInvitation.invitedEmail,
										role: createdInvitation.role,
									})}
								</Text>
								<Text>
									{`${t("workspaces.applicationsInvitationAcceptanceUrlLabel")}: ${createdInvitation.acceptanceUrl}`}
								</Text>
								<Link href={createdInvitation.acceptanceUrl}>
									{t("workspaces.applicationsInvitationOpenLinkAction")}
								</Link>
							</Notice>
						) : null}

						{invitationErrorNotice ? (
							<Notice
								noticeRole={invitationErrorNotice.noticeRole}
								noticeTitle={t(invitationErrorNotice.titleKey)}
								noticeTitleTag="h3"
							>
								<Text>
									{invitationErrorNotice.bodyText ??
										t(invitationErrorNotice.bodyKey)}
								</Text>
							</Notice>
						) : null}

						<form className="grid gap-200" onSubmit={handleCreateInvitation}>
							<Input
								required
								inputId="developer-invitation-email"
								label={t("workspaces.applicationsInvitationEmailLabel")}
								name="developer-invitation-email"
								type="email"
								value={invitationForm.invitedEmail}
								onInput={(event): void => {
									setInvitationForm((currentForm) => ({
										...currentForm,
										invitedEmail: (
											event.target as HTMLInputElement
										).value,
									}));
								}}
							/>
							<Select
								required
								label={t("workspaces.applicationsInvitationRoleLabel")}
								name="developer-invitation-role"
								selectId="developer-invitation-role"
								value={invitationForm.role}
								onInput={(event): void => {
									setInvitationForm((currentForm) => ({
										...currentForm,
										role: (
											event.target as HTMLSelectElement
										).value,
									}));
								}}
							>
								<option value="RP Admin">
									{t("workspaces.applicationsInvitationRoleAdmin")}
								</option>
								<option value="RP User (Edit)">
									{t("workspaces.applicationsInvitationRoleEdit")}
								</option>
								<option value="Read Only">
									{t("workspaces.applicationsInvitationRoleReadOnly")}
								</option>
							</Select>
							<DateInput
								required
								format="full"
								max="2099-12-31"
								min={getToday()}
								name="developer-invitation-expires-at"
								value={invitationForm.inviteExpiresAt}
								legend={t(
									"workspaces.applicationsInvitationExpiresAtLabel"
								)}
								onInput={(event): void => {
									setInvitationForm((currentForm) => ({
										...currentForm,
										inviteExpiresAt: (
											event.target as HTMLInputElement
										).value,
									}));
								}}
							/>
							<div>
								<Button className="w-full md:w-auto" type="submit">
									{isCreatingInvitation
										? t(
												"workspaces.applicationsInvitationCreatingAction"
										  )
										: t(
												"workspaces.applicationsInvitationCreateAction"
										  )}
								</Button>
							</div>
						</form>

						{isLoadingInvitations ? (
							<Notice
								noticeRole="info"
								noticeTitleTag="h3"
								noticeTitle={t(
									"workspaces.applicationsInvitationsLoadingTitle"
								)}
							>
								<Text>
									{t("workspaces.applicationsInvitationsLoadingBody")}
								</Text>
							</Notice>
						) : invitations.length === 0 ? (
							<Text>{t("workspaces.applicationsInvitationsEmpty")}</Text>
						) : (
							<div className="grid gap-200">
								{invitations.map((invitation) => (
									<div
										key={invitation.uuid}
										className="grid gap-100 rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-200"
									>
										<Text>
											{`${t("workspaces.applicationsInvitationEmailLabel")}: ${invitation.invitedEmail}`}
										</Text>
										<Text>
											{`${t("workspaces.applicationsInvitationRoleLabel")}: ${invitation.role}`}
										</Text>
										<Text>
											{`${t("workspaces.applicationsInvitationStatusLabel")}: ${getInvitationStatusLabel(t, invitation.status)}`}
										</Text>
										<Text>
											{`${t("workspaces.applicationsInvitationExpiresAtDisplayLabel")}: ${invitation.inviteExpiresAt}`}
										</Text>
										{invitation.status === "pending" ? (
											<div>
												<Button
													buttonRole="danger"
													type="button"
													onGcdsClick={() => {
														void handleRevokeInvitation(invitation.uuid);
													}}
												>
													{isRevokingInvitation
														? t(
																"workspaces.applicationsInvitationRevokingAction"
														  )
														: t(
																"workspaces.applicationsInvitationRevokeAction"
														  )}
												</Button>
											</div>
										) : null}
									</div>
								))}
							</div>
						)}
					</div>

					<div className="flex flex-wrap gap-200">
						<Button
							buttonRole="secondary"
							href={`/workspaces/${workspaceUuid}/applications/${rpApplicationUuid}/edit`}
							type="link"
						>
							{t("workspaces.applicationsEditAction")}
						</Button>
						<Button
							buttonRole="secondary"
							href={`/workspaces/${workspaceUuid}/applications/${rpApplicationUuid}/usage`}
							type="link"
						>
							{t("workspaces.applicationsUsageAction")}
						</Button>
						<Button
							buttonRole="secondary"
							href={`/workspaces/${workspaceUuid}/applications/${rpApplicationUuid}/audit`}
							type="link"
						>
							{t("workspaces.applicationsAuditAction")}
						</Button>
						{linkedApplicationInformation ? (
							<Button
								buttonRole="secondary"
								href={`/workspaces/${workspaceUuid}/application-information/${linkedApplicationInformation.uuid}`}
								type="link"
							>
								{t("workspaces.manageApplicationInformation")}
							</Button>
						) : null}
						<Button
							buttonRole="danger"
							type="button"
							onGcdsClick={() => {
								setDeleteDialogOpen(true);
							}}
						>
							{t("workspaces.deleteApplication")}
						</Button>
						<Button
							href={`/workspaces/${workspaceUuid}/applications`}
							type="link"
						>
							{t("workspaces.applicationsBackToList")}
						</Button>
					</div>
				</div>
			) : null}

			<ConfirmDialog
				cancelLabel={t("common.cancel")}
				isOpen={deleteDialogOpen}
				title={t("workspaces.deleteApplicationConfirmTitle")}
				confirmLabel={
					isDeleting
						? t("workspaces.deletingAction")
						: t("workspaces.deleteApplication")
				}
				description={t("workspaces.deleteApplicationConfirmBody", {
					name: application?.dnr_app_name ?? "",
				})}
				onCancel={() => {
					setDeleteDialogOpen(false);
				}}
				onConfirm={() => {
					void handleDeleteApplication();
				}}
			/>
		</>
	);
};
