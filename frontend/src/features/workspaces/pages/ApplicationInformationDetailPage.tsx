import { useState } from "react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useSession } from "@/hooks";
import {
	Button,
	ConfirmDialog,
	DataTable,
	Heading,
	Notice,
	Select,
	Text,
	Textarea,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { getRequestErrorNotice } from "@/fetch";
import type {
	ApplicationInformationContactRead,
	ApplicationInformationReviewChecklistSummaryRead,
	ApplicationInformationReviewChecklistStatus,
	ApplicationInformationReviewDisposition,
} from "@/fetch/workspaces";
import {
	createEmptyApplicationInformationContactForm,
	toApplicationInformationContactCreatePayload,
	toApplicationInformationContactFormState,
	toApplicationInformationContactUpdatePayload,
	type ApplicationInformationContactFormState,
} from "../application-information-contact-form";
import { ApplicationInformationContactForm } from "../components/ApplicationInformationContactForm";
import { useApplicationInformationContacts } from "../hooks/use-application-information-contacts";
import { useApplicationInformationManagement } from "../hooks/use-application-information-management";
import { useApplicationInformationReview } from "../hooks/use-application-information-review";
import { useWorkspaceApplicationInformation } from "../hooks/use-workspace-application-information";
import { getWorkspaceOnboardingStateLabel } from "../onboarding-display";
import {
	getApplicationInformationReadinessSummary,
	type ApplicationInformationReadinessKey,
	type ApplicationInformationReadinessStatus,
} from "../onboarding-readiness";

type Translate = (
	key: string | Array<string>,
	options?: Record<string, unknown>
) => string;

type ContactRow = {
	email: string;
	name: string;
	phoneNumber: string;
	responsibility: string;
	uuid: string;
};

type ReadinessDisplayItem = {
	key: ApplicationInformationReadinessKey;
	label: string;
	nextStep: string;
	status: ApplicationInformationReadinessStatus;
	statusLabel: string;
};

type ReviewChecklistFormState = {
	applicationInformationStatus: ApplicationInformationReviewChecklistStatus;
	contactsStatus: ApplicationInformationReviewChecklistStatus;
	environmentRegistrationStatus: ApplicationInformationReviewChecklistStatus;
	evidenceReferenceStatus: ApplicationInformationReviewChecklistStatus;
	processLinksStatus: ApplicationInformationReviewChecklistStatus;
	promotionMetadataStatus: ApplicationInformationReviewChecklistStatus;
	rationale: string;
	reviewDisposition: ApplicationInformationReviewDisposition;
};

const createEmptyReviewChecklistForm = (): ReviewChecklistFormState => ({
	applicationInformationStatus: "not_started",
	contactsStatus: "not_started",
	environmentRegistrationStatus: "not_started",
	evidenceReferenceStatus: "not_started",
	processLinksStatus: "not_started",
	promotionMetadataStatus: "not_started",
	rationale: "",
	reviewDisposition: "pending",
});

const toReviewChecklistForm = (
	checklistSummary: ApplicationInformationReviewChecklistSummaryRead | null
): ReviewChecklistFormState => {
	if (!checklistSummary) {
		return createEmptyReviewChecklistForm();
	}

	return {
		applicationInformationStatus:
			checklistSummary.applicationInformationStatus,
		contactsStatus: checklistSummary.contactsStatus,
		environmentRegistrationStatus:
			checklistSummary.environmentRegistrationStatus,
		evidenceReferenceStatus: checklistSummary.evidenceReferenceStatus,
		processLinksStatus: checklistSummary.processLinksStatus,
		promotionMetadataStatus: checklistSummary.promotionMetadataStatus,
		rationale: checklistSummary.rationale ?? "",
		reviewDisposition: checklistSummary.reviewDisposition,
	};
};

type ReviewChecklistEditorProps = {
	initialForm: ReviewChecklistFormState;
	isSavingChecklist: boolean;
	onSave: (form: ReviewChecklistFormState) => Promise<void>;
	t: Translate;
};

const ReviewChecklistEditor = ({
	initialForm,
	isSavingChecklist,
	onSave,
	t,
}: ReviewChecklistEditorProps): FunctionComponent => {
	const [reviewChecklistForm, setReviewChecklistForm] =
		useState<ReviewChecklistFormState>(initialForm);

	const updateReviewChecklistField = (
		field: keyof ReviewChecklistFormState,
		value: string
	): void => {
		setReviewChecklistForm((currentForm) => ({
			...currentForm,
			[field]: value,
		}));
	};

	return (
		<div className="grid gap-150 rounded-sm border border-solid border-[#d9d9d9] p-200">
			<Select
				label={t("workspaces.appInfoInternalReviewDispositionLabel")}
				name="reviewDisposition"
				selectId="review-disposition"
				value={reviewChecklistForm.reviewDisposition}
				onInput={(event): void => {
					updateReviewChecklistField(
						"reviewDisposition",
						(event.target as HTMLSelectElement).value
					);
				}}
			>
				<option value="pending">
					{t("workspaces.appInfoInternalReviewDispositionPending")}
				</option>
				<option value="changes_requested">
					{t("workspaces.appInfoInternalReviewDispositionChangesRequested")}
				</option>
				<option value="ready_for_next_step">
					{t("workspaces.appInfoInternalReviewDispositionReadyForNextStep")}
				</option>
			</Select>
			<Select
				label={t("workspaces.appInfoInternalReviewApplicationInformationLabel")}
				name="applicationInformationStatus"
				selectId="review-application-information-status"
				value={reviewChecklistForm.applicationInformationStatus}
				onInput={(event): void => {
					updateReviewChecklistField(
						"applicationInformationStatus",
						(event.target as HTMLSelectElement).value
					);
				}}
			>
				<option value="not_started">{t("workspaces.appInfoReadinessStatusNotStarted")}</option>
				<option value="incomplete">{t("workspaces.appInfoReadinessStatusIncomplete")}</option>
				<option value="complete">{t("workspaces.appInfoReadinessStatusComplete")}</option>
			</Select>
			<Select
				label={t("workspaces.appInfoReadinessContactsLabel")}
				name="contactsStatus"
				selectId="review-contacts-status"
				value={reviewChecklistForm.contactsStatus}
				onInput={(event): void => {
					updateReviewChecklistField(
						"contactsStatus",
						(event.target as HTMLSelectElement).value
					);
				}}
			>
				<option value="not_started">{t("workspaces.appInfoReadinessStatusNotStarted")}</option>
				<option value="incomplete">{t("workspaces.appInfoReadinessStatusIncomplete")}</option>
				<option value="complete">{t("workspaces.appInfoReadinessStatusComplete")}</option>
			</Select>
			<Select
				label={t("workspaces.appInfoInternalReviewEnvironmentRegistrationLabel")}
				name="environmentRegistrationStatus"
				selectId="review-environment-registration-status"
				value={reviewChecklistForm.environmentRegistrationStatus}
				onInput={(event): void => {
					updateReviewChecklistField(
						"environmentRegistrationStatus",
						(event.target as HTMLSelectElement).value
					);
				}}
			>
				<option value="not_started">{t("workspaces.appInfoReadinessStatusNotStarted")}</option>
				<option value="incomplete">{t("workspaces.appInfoReadinessStatusIncomplete")}</option>
				<option value="complete">{t("workspaces.appInfoReadinessStatusComplete")}</option>
			</Select>
			<Select
				label={t("workspaces.appInfoInternalReviewPromotionMetadataLabel")}
				name="promotionMetadataStatus"
				selectId="review-promotion-metadata-status"
				value={reviewChecklistForm.promotionMetadataStatus}
				onInput={(event): void => {
					updateReviewChecklistField(
						"promotionMetadataStatus",
						(event.target as HTMLSelectElement).value
					);
				}}
			>
				<option value="not_started">{t("workspaces.appInfoReadinessStatusNotStarted")}</option>
				<option value="incomplete">{t("workspaces.appInfoReadinessStatusIncomplete")}</option>
				<option value="complete">{t("workspaces.appInfoReadinessStatusComplete")}</option>
			</Select>
			<Select
				label={t("workspaces.appInfoInternalReviewEvidenceReferenceLabel")}
				name="evidenceReferenceStatus"
				selectId="review-evidence-reference-status"
				value={reviewChecklistForm.evidenceReferenceStatus}
				onInput={(event): void => {
					updateReviewChecklistField(
						"evidenceReferenceStatus",
						(event.target as HTMLSelectElement).value
					);
				}}
			>
				<option value="not_started">{t("workspaces.appInfoReadinessStatusNotStarted")}</option>
				<option value="incomplete">{t("workspaces.appInfoReadinessStatusIncomplete")}</option>
				<option value="complete">{t("workspaces.appInfoReadinessStatusComplete")}</option>
			</Select>
			<Select
				label={t("workspaces.appInfoInternalReviewProcessLinksLabel")}
				name="processLinksStatus"
				selectId="review-process-links-status"
				value={reviewChecklistForm.processLinksStatus}
				onInput={(event): void => {
					updateReviewChecklistField(
						"processLinksStatus",
						(event.target as HTMLSelectElement).value
					);
				}}
			>
				<option value="not_started">{t("workspaces.appInfoReadinessStatusNotStarted")}</option>
				<option value="incomplete">{t("workspaces.appInfoReadinessStatusIncomplete")}</option>
				<option value="complete">{t("workspaces.appInfoReadinessStatusComplete")}</option>
			</Select>
			<Textarea
				label={t("workspaces.appInfoInternalReviewRationaleLabel")}
				name="reviewRationale"
				textareaId="review-rationale"
				value={reviewChecklistForm.rationale}
				onInput={(event): void => {
					updateReviewChecklistField(
						"rationale",
						(event.target as HTMLTextAreaElement).value
					);
				}}
			/>
			<Button
				buttonRole="secondary"
				disabled={isSavingChecklist}
				type="button"
				onGcdsClick={() => {
					void onSave(reviewChecklistForm);
				}}
			>
				{isSavingChecklist
					? t("workspaces.appInfoInternalReviewChecklistSavingAction")
					: t("workspaces.appInfoInternalReviewChecklistSaveAction")}
			</Button>
		</div>
	);
};

export const ApplicationInformationDetailPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as { t: Translate };
	const navigate = useNavigate();
	const { currentUser } = useSession();
	const { applicationInformationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/application-information/$applicationInformationUuid",
	});
	const search = useSearch({
		from: "/workspaces/$workspaceUuid/application-information/$applicationInformationUuid",
	});
	const {
		applicationInformation,
		error,
		isLoading,
	} = useWorkspaceApplicationInformation(
		workspaceUuid,
		applicationInformationUuid
	);
	const {
		addContact,
		contacts,
		error: contactsError,
		isAdding,
		isDeleting,
		isLoading: isLoadingContacts,
		isUpdating,
		removeContact,
		updateContact,
	} = useApplicationInformationContacts(
		workspaceUuid,
		applicationInformationUuid
	);
	const { deleteApplicationInformation, isDeleting: isDeletingApplicationInformation } =
		useApplicationInformationManagement();
	const isInternalReviewer = currentUser?.isSuperuser === true;
	const {
		addNote,
		checklistSummary,
		error: reviewError,
		isAddingNote,
		isLoading: isLoadingReview,
		isSavingChecklist,
		notes: reviewNotes,
		saveChecklistSummary,
	} = useApplicationInformationReview(
		workspaceUuid,
		applicationInformationUuid,
		isInternalReviewer
	);
	const [contactForm, setContactForm] =
		useState<ApplicationInformationContactFormState>(
			createEmptyApplicationInformationContactForm
		);
	const [reviewNoteBody, setReviewNoteBody] = useState("");
	const [deleteApplicationInformationDialogOpen, setDeleteApplicationInformationDialogOpen] =
		useState(false);
	const [deleteContactTarget, setDeleteContactTarget] =
		useState<ApplicationInformationContactRead | null>(null);
	const [editingContact, setEditingContact] =
		useState<ApplicationInformationContactRead | null>(null);
	const [isContactFormOpen, setIsContactFormOpen] = useState(false);
	const [localError, setLocalError] = useState<Error | null>(null);
	const [localSuccessMessage, setLocalSuccessMessage] = useState<string | null>(
		null
	);
	const contactRows: Array<ContactRow> = contacts.map((contact) => ({
		email: contact.email,
		name: `${contact.nameEn} / ${contact.nameFr}`,
		phoneNumber: contact.phoneNumber ?? t("common.notAvailable"),
		responsibility: `${contact.responsibilityEn} / ${contact.responsibilityFr}`,
		uuid: contact.uuid,
	}));
	const contactColumns: Array<DataTableColumn<ContactRow>> = [
		{ field: "name", headerName: t("workspaces.appInfoContactNameLabel") },
		{
			field: "responsibility",
			headerName: t("workspaces.appInfoContactResponsibilityLabel"),
		},
		{ field: "email", headerName: t("workspaces.appInfoContactEmailLabel") },
		{
			field: "phoneNumber",
			headerName: t("workspaces.appInfoContactPhoneNumberLabel"),
		},
	];
	const successMessage =
		localSuccessMessage ??
		(search.created === "1"
			? t("workspaces.appInfoCreatedSuccess")
			: search.updated === "1"
				? t("workspaces.appInfoUpdatedSuccess")
				: null);
	const errorNotice = getRequestErrorNotice(
		localError ?? contactsError ?? error,
		{
			bodyKey: "workspaces.appInfoErrorBody",
			titleKey: "workspaces.appInfoErrorTitle",
		}
	);
	const readinessSummary =
		applicationInformation && !isLoadingContacts
			? getApplicationInformationReadinessSummary(
					applicationInformation,
					contacts
				)
			: null;
	const readinessStatusLabel = (
		status: ApplicationInformationReadinessStatus
	): string => {
		switch (status) {
			case "complete":
				return t("workspaces.appInfoReadinessStatusComplete");
			case "incomplete":
				return t("workspaces.appInfoReadinessStatusIncomplete");
			default:
				return t("workspaces.appInfoReadinessStatusNotStarted");
		}
	};
	const readinessItems: Array<ReadinessDisplayItem> =
		readinessSummary?.items.map((item) => {
			switch (item.key) {
				case "service_identity":
					return {
						key: item.key,
						label: t("workspaces.appInfoReadinessServiceIdentityLabel"),
						nextStep: t(
							"workspaces.appInfoReadinessServiceIdentityNextStep"
						),
						status: item.status,
						statusLabel: readinessStatusLabel(item.status),
					};
				case "business_context":
					return {
						key: item.key,
						label: t("workspaces.appInfoReadinessBusinessContextLabel"),
						nextStep: t(
							"workspaces.appInfoReadinessBusinessContextNextStep"
						),
						status: item.status,
						statusLabel: readinessStatusLabel(item.status),
					};
				case "technical_integration":
					return {
						key: item.key,
						label: t(
							"workspaces.appInfoReadinessTechnicalIntegrationLabel"
						),
						nextStep: t(
							"workspaces.appInfoReadinessTechnicalIntegrationNextStep"
						),
						status: item.status,
						statusLabel: readinessStatusLabel(item.status),
					};
				case "security_posture":
					return {
						key: item.key,
						label: t("workspaces.appInfoReadinessSecurityPostureLabel"),
						nextStep: t(
							"workspaces.appInfoReadinessSecurityPostureNextStep"
						),
						status: item.status,
						statusLabel: readinessStatusLabel(item.status),
					};
				case "migration_planning":
					return {
						key: item.key,
						label: t("workspaces.appInfoReadinessMigrationPlanningLabel"),
						nextStep: t(
							"workspaces.appInfoReadinessMigrationPlanningNextStep"
						),
						status: item.status,
						statusLabel: readinessStatusLabel(item.status),
					};
				case "contacts":
					return {
						key: item.key,
						label: t("workspaces.appInfoReadinessContactsLabel"),
						nextStep: t("workspaces.appInfoReadinessContactsNextStep"),
						status: item.status,
						statusLabel: readinessStatusLabel(item.status),
					};
			}
		}) ?? [];
	const canEditInternalReview =
		isInternalReviewer &&
		(applicationInformation?.onboardingState === "submitted" ||
			applicationInformation?.onboardingState === "under_review");
	const reviewDispositionLabel = (
		disposition: ApplicationInformationReviewDisposition
	): string => {
		switch (disposition) {
			case "changes_requested":
				return t("workspaces.appInfoInternalReviewDispositionChangesRequested");
			case "ready_for_next_step":
				return t("workspaces.appInfoInternalReviewDispositionReadyForNextStep");
			default:
				return t("workspaces.appInfoInternalReviewDispositionPending");
		}
	};

	const updateContactFormField = (
		field: keyof ApplicationInformationContactFormState,
		value: string
	): void => {
		setContactForm((currentForm) => ({ ...currentForm, [field]: value }));
	};

	const closeContactForm = (): void => {
		setContactForm(createEmptyApplicationInformationContactForm());
		setEditingContact(null);
		setIsContactFormOpen(false);
	};

	const handleStartCreateContact = (): void => {
		setLocalError(null);
		setLocalSuccessMessage(null);
		setEditingContact(null);
		setContactForm(createEmptyApplicationInformationContactForm());
		setIsContactFormOpen(true);
	};

	const handleStartEditContact = (contactUuid: string): void => {
		const contact = contacts.find((entry) => entry.uuid === contactUuid) ?? null;

		if (!contact) {
			return;
		}

		setLocalError(null);
		setLocalSuccessMessage(null);
		setEditingContact(contact);
		setContactForm(toApplicationInformationContactFormState(contact));
		setIsContactFormOpen(true);
	};

	const handleSaveContact = async (): Promise<void> => {
		setLocalError(null);

		try {
			if (editingContact) {
				await updateContact(
					editingContact.uuid,
					toApplicationInformationContactUpdatePayload(contactForm)
				);
				setLocalSuccessMessage(t("workspaces.appInfoContactUpdatedSuccess"));
			} else {
				await addContact(
					toApplicationInformationContactCreatePayload(contactForm)
				);
				setLocalSuccessMessage(t("workspaces.appInfoContactCreatedSuccess"));
			}

			closeContactForm();
		} catch (requestError) {
			setLocalError(requestError as Error);
		}
	};

	const handleDeleteContact = async (): Promise<void> => {
		if (!deleteContactTarget) {
			return;
		}

		setLocalError(null);

		try {
			await removeContact(deleteContactTarget.uuid);
			setDeleteContactTarget(null);
			setLocalSuccessMessage(t("workspaces.appInfoContactDeletedSuccess"));
		} catch (requestError) {
			setLocalError(requestError as Error);
		}
	};

	const handleDeleteApplicationInformation = async (): Promise<void> => {
		setLocalError(null);

		try {
			await deleteApplicationInformation(
				workspaceUuid,
				applicationInformationUuid
			);

			await navigate({
				params: { workspaceUuid },
				replace: true,
				search: { deleted: "1" },
				to: "/workspaces/$workspaceUuid/application-information",
			});
		} catch (requestError) {
			setDeleteApplicationInformationDialogOpen(false);
			setLocalError(requestError as Error);
		}
	};

	const handleSaveReviewNote = async (): Promise<void> => {
		const trimmedBody = reviewNoteBody.trim();
		if (trimmedBody.length === 0) {
			return;
		}

		setLocalError(null);

		try {
			await addNote({ body: trimmedBody });
			setReviewNoteBody("");
			setLocalSuccessMessage(t("workspaces.appInfoInternalReviewNoteSavedSuccess"));
		} catch (requestError) {
			setLocalError(requestError as Error);
		}
	};

	const handleSaveReviewChecklist = async (
		form: ReviewChecklistFormState
	): Promise<void> => {
		setLocalError(null);

		try {
			await saveChecklistSummary({
				applicationInformationStatus:
					form.applicationInformationStatus,
				contactsStatus: form.contactsStatus,
				environmentRegistrationStatus:
					form.environmentRegistrationStatus,
				evidenceReferenceStatus:
					form.evidenceReferenceStatus,
				processLinksStatus: form.processLinksStatus,
				promotionMetadataStatus:
					form.promotionMetadataStatus,
				rationale: form.rationale.trim().length > 0
					? form.rationale.trim()
						: null,
				reviewDisposition: form.reviewDisposition,
			});
			setLocalSuccessMessage(
				t("workspaces.appInfoInternalReviewChecklistSavedSuccess")
			);
		} catch (requestError) {
			setLocalError(requestError as Error);
		}
	};

	return (
		<>
			<Heading tag="h1">
				{applicationInformation
					? t("workspaces.appInfoDetailTitle", {
							name: applicationInformation.serviceNameEn,
						})
					: t("workspaces.appInfoSectionTitle")}
			</Heading>
			<Text>{t("workspaces.appInfoDetailSummary")}</Text>

			{successMessage ? (
				<Notice
					noticeRole="success"
					noticeTitle={successMessage}
					noticeTitleTag="h2"
				>
					<Text>{successMessage}</Text>
				</Notice>
			) : null}

			{isLoading || isLoadingContacts ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("workspaces.appInfoLoadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.appInfoLoadingBody")}</Text>
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

			{applicationInformation ? (
				<div className="grid gap-300">
					{readinessSummary ? (
						<div className="grid gap-200 rounded-sm border border-solid border-[#d9d9d9] p-300">
							<Heading tag="h2">
								{t("workspaces.appInfoReadinessTitle")}
							</Heading>
							<dl className="grid gap-150">
								<div>
									<dt>
										<strong>
											{t(
												"workspaces.appInfoReadinessSummaryLabel"
											)}
										</strong>
									</dt>
									<dd>
										{readinessSummary.submitReady
											? t("workspaces.appInfoReadinessReady")
											: t("workspaces.appInfoReadinessAttentionRequired")}
									</dd>
								</div>
							</dl>

							{!readinessSummary.submitReady ? (
								<Notice
									noticeRole="warning"
									noticeTitle={t("workspaces.appInfoReadinessWarningTitle")}
									noticeTitleTag="h3"
								>
									<Text>
										{t("workspaces.appInfoReadinessWarningBody")}
									</Text>
								</Notice>
							) : null}

							<ul className="grid gap-150 list-none pl-0">
								{readinessItems.map((item) => (
									<li
										key={item.key}
										className="rounded-sm border border-solid border-[#d9d9d9] p-200"
									>
										<Text>
											<strong>{item.label}</strong>: {item.statusLabel}
										</Text>
										{item.status !== "complete" ? (
											<Text>{item.nextStep}</Text>
										) : null}
									</li>
								))}
							</ul>

							<Notice
								noticeRole="info"
								noticeTitle={t("workspaces.appInfoReadinessExternalInfoTitle")}
								noticeTitleTag="h3"
							>
								<Text>
									{t("workspaces.appInfoReadinessExternalInfoBody")}
								</Text>
							</Notice>
						</div>
					) : null}

					{isInternalReviewer ? (
						<div className="grid gap-200 rounded-sm border border-solid border-[#d9d9d9] p-300">
							<Heading tag="h2">
								{t("workspaces.appInfoInternalReviewTitle")}
							</Heading>
							<Text>
								{t("workspaces.appInfoInternalReviewSummary")}
							</Text>

							{isLoadingReview ? (
								<Notice
									noticeRole="info"
									noticeTitleTag="h3"
									noticeTitle={t(
										"workspaces.appInfoInternalReviewLoadingTitle"
									)}
								>
									<Text>
										{t("workspaces.appInfoInternalReviewLoadingBody")}
									</Text>
								</Notice>
							) : null}

							{reviewError ? (
								<Notice
									noticeRole="warning"
									noticeTitleTag="h3"
									noticeTitle={t(
										"workspaces.appInfoInternalReviewErrorTitle"
									)}
								>
									<Text>
										{t("workspaces.appInfoInternalReviewErrorBody")}
									</Text>
								</Notice>
							) : null}

							{!isLoadingReview && !reviewError ? (
								<div className="grid gap-250">
									<div className="grid gap-200">
										<Heading tag="h3">
											{t("workspaces.appInfoInternalReviewChecklistTitle")}
										</Heading>

										{checklistSummary ? (
											<div className="grid gap-150 rounded-sm border border-solid border-[#d9d9d9] p-200">
												<Text>
													{`${t("workspaces.appInfoInternalReviewDispositionLabel")}: ${reviewDispositionLabel(checklistSummary.reviewDisposition)}`}
												</Text>
												<Text>
													{`${t("workspaces.appInfoInternalReviewReviewedByLabel")}: ${checklistSummary.reviewedByName ?? t("common.notAvailable")}`}
												</Text>
												<Text>
													{`${t("workspaces.appInfoInternalReviewUpdatedAtLabel")}: ${checklistSummary.updatedAt ?? checklistSummary.createdAt}`}
												</Text>
												<Text>
													{`${t("workspaces.appInfoInternalReviewApplicationInformationLabel")}: ${readinessStatusLabel(checklistSummary.applicationInformationStatus)}`}
												</Text>
												<Text>
													{`${t("workspaces.appInfoReadinessContactsLabel")}: ${readinessStatusLabel(checklistSummary.contactsStatus)}`}
												</Text>
												<Text>
													{`${t("workspaces.appInfoInternalReviewEnvironmentRegistrationLabel")}: ${readinessStatusLabel(checklistSummary.environmentRegistrationStatus)}`}
												</Text>
												<Text>
													{`${t("workspaces.appInfoInternalReviewPromotionMetadataLabel")}: ${readinessStatusLabel(checklistSummary.promotionMetadataStatus)}`}
												</Text>
												<Text>
													{`${t("workspaces.appInfoInternalReviewEvidenceReferenceLabel")}: ${readinessStatusLabel(checklistSummary.evidenceReferenceStatus)}`}
												</Text>
												<Text>
													{`${t("workspaces.appInfoInternalReviewProcessLinksLabel")}: ${readinessStatusLabel(checklistSummary.processLinksStatus)}`}
												</Text>
												{checklistSummary.rationale ? (
													<Text>
														{`${t("workspaces.appInfoInternalReviewRationaleLabel")}: ${checklistSummary.rationale}`}
													</Text>
												) : null}
											</div>
										) : (
											<Notice
												noticeRole="info"
												noticeTitleTag="h4"
												noticeTitle={t(
													"workspaces.appInfoInternalReviewNoChecklistTitle"
												)}
											>
												<Text>
													{t(
														"workspaces.appInfoInternalReviewNoChecklistBody"
													)}
												</Text>
											</Notice>
										)}

										{canEditInternalReview ? (
											<ReviewChecklistEditor
												key={checklistSummary?.updatedAt ?? checklistSummary?.createdAt ?? "empty"}
												initialForm={toReviewChecklistForm(checklistSummary)}
												isSavingChecklist={isSavingChecklist}
												t={t}
												onSave={handleSaveReviewChecklist}
											/>
										) : (
											<Notice
												noticeRole="info"
												noticeTitleTag="h4"
												noticeTitle={t(
													"workspaces.appInfoInternalReviewReadOnlyTitle"
												)}
											>
												<Text>
													{t("workspaces.appInfoInternalReviewReadOnlyBody")}
												</Text>
											</Notice>
										)}
									</div>

									<div className="grid gap-200">
										<Heading tag="h3">
											{t("workspaces.appInfoInternalReviewNotesTitle")}
										</Heading>

										{reviewNotes.length === 0 ? (
											<Notice
												noticeRole="info"
												noticeTitleTag="h4"
												noticeTitle={t(
													"workspaces.appInfoInternalReviewNoNotesTitle"
												)}
											>
												<Text>
													{t("workspaces.appInfoInternalReviewNoNotesBody")}
												</Text>
											</Notice>
										) : (
											<ul className="grid gap-150 list-none pl-0">
												{reviewNotes.map((note) => (
													<li
														key={note.uuid}
														className="rounded-sm border border-solid border-[#d9d9d9] p-200"
													>
														<Text>
															{`${note.authorName ?? t("common.notAvailable")} - ${note.createdAt}`}
														</Text>
														<Text>{note.body}</Text>
													</li>
												))}
											</ul>
										)}

										{canEditInternalReview ? (
											<div className="grid gap-150 rounded-sm border border-solid border-[#d9d9d9] p-200">
												<Textarea
													label={t("workspaces.appInfoInternalReviewNoteLabel")}
													name="reviewNote"
													textareaId="review-note-body"
													value={reviewNoteBody}
													onInput={(event): void => {
														setReviewNoteBody(
															(event.target as HTMLTextAreaElement).value
														);
													}}
												/>
												<Button
													buttonRole="secondary"
													type="button"
													disabled={
														isAddingNote || reviewNoteBody.trim().length === 0
													}
													onGcdsClick={() => {
														void handleSaveReviewNote();
													}}
												>
													{isAddingNote
														? t(
															"workspaces.appInfoInternalReviewNoteSavingAction"
														)
														: t(
															"workspaces.appInfoInternalReviewNoteSaveAction"
														)}
												</Button>
											</div>
										) : null}
									</div>
								</div>
							) : null}
						</div>
					) : null}

					<Heading tag="h2">{t("workspaces.appInfoSectionTitle")}</Heading>
					<Text>{`${t("workspaces.appInfoServiceNameEnLabel")}: ${applicationInformation.serviceNameEn}`}</Text>
					<Text>{`${t("workspaces.appInfoServiceNameFrLabel")}: ${applicationInformation.serviceNameFr}`}</Text>
					<Text>
						{`${t("workspaces.onboardingStateLabel")}: ${applicationInformation.onboardingState?.trim() ? getWorkspaceOnboardingStateLabel(t, applicationInformation.onboardingState) : t("common.notAvailable")}`}
					</Text>
					<Text>{`${t("workspaces.appInfoOverviewLabel")}: ${applicationInformation.overview}`}</Text>
					<Text>{`${t("workspaces.appInfoTechnologyAndProtocolLabel")}: ${applicationInformation.technologyAndProtocol}`}</Text>
					<Text>{`${t("workspaces.appInfoSecurityAndPrivacyLabel")}: ${applicationInformation.securityAndPrivacy}`}</Text>
					<Text>{`${t("workspaces.appInfoUsageLabel")}: ${applicationInformation.usage}`}</Text>
					<Text>{`${t("workspaces.appInfoMigrationOrTransitionPlanLabel")}: ${applicationInformation.migrationOrTransitionPlan}`}</Text>
					<Text>
						{`${t("workspaces.submittedAtLabel")}: ${applicationInformation.submittedAt ?? t("common.notAvailable")}`}
					</Text>
					<Text>
						{`${t("workspaces.underReviewAtLabel")}: ${applicationInformation.underReviewAt ?? t("common.notAvailable")}`}
					</Text>
					<Text>
						{`${t("workspaces.approvedAtLabel")}: ${applicationInformation.approvedAt ?? t("common.notAvailable")}`}
					</Text>
					<Text>
						{`${t("workspaces.launchedAtLabel")}: ${applicationInformation.launchedAt ?? t("common.notAvailable")}`}
					</Text>
					<div className="flex flex-wrap gap-200">
						<Button
							buttonRole="secondary"
							href={`/workspaces/${workspaceUuid}/application-information/${applicationInformationUuid}/edit`}
							type="link"
						>
							{t("workspaces.appInfoEdit")}
						</Button>
						<Button
							buttonRole="danger"
							type="button"
							onGcdsClick={() => {
								setDeleteApplicationInformationDialogOpen(true);
							}}
						>
							{t("workspaces.appInfoDelete")}
						</Button>
						<Button
							href={`/workspaces/${workspaceUuid}/application-information`}
							type="link"
						>
							{t("workspaces.appInfoBackToList")}
						</Button>
					</div>

					<div className="grid gap-200 rounded-sm border border-solid border-[#d9d9d9] p-300">
						<Heading tag="h2">{t("workspaces.appInfoContacts")}</Heading>
						<Text>{t("workspaces.appInfoContactsSummary")}</Text>

						{isContactFormOpen ? (
							<div className="grid gap-200">
								<Heading tag="h3">
									{editingContact
										? t("workspaces.appInfoEditContactModalTitle")
										: t("workspaces.appInfoContactModalTitle")}
								</Heading>
								<ApplicationInformationContactForm
									form={contactForm}
									isSubmitting={isAdding || isUpdating}
									submitLabel={
										isAdding || isUpdating
											? t("workspaces.appInfoSavingContactAction")
											: editingContact
												? t("workspaces.appInfoContactSaveAction")
												: t("workspaces.appInfoCreateContact")
									}
									onCancel={closeContactForm}
									onChange={updateContactFormField}
									onSubmit={() => {
										void handleSaveContact();
									}}
								/>
							</div>
						) : (
							<Button type="button" onGcdsClick={handleStartCreateContact}>
								{t("workspaces.appInfoCreateContact")}
							</Button>
						)}

						{contacts.length === 0 ? (
							<Notice
								noticeRole="warning"
								noticeTitle={t("workspaces.appInfoNoContactsTitle")}
								noticeTitleTag="h3"
							>
								<Text>{t("workspaces.appInfoNoContactsBody")}</Text>
							</Notice>
						) : (
							<DataTable
								columns={contactColumns}
								getRowId={(row): string => row.uuid}
								itemLabel="application information contacts"
								pagination={false}
								rows={contactRows}
								title={t("workspaces.appInfoContacts")}
								action={[
									{
										buttonLabel: t("workspaces.appInfoContactEdit"),
										buttonRole: "secondary",
										onAction: (row): void => {
											handleStartEditContact(row.uuid);
										},
										screenReaderLabel: (row): string => row.name,
										variant: "button",
									},
									{
										buttonLabel: t("workspaces.appInfoContactDelete"),
										buttonRole: "danger",
										onAction: (row): void => {
											setDeleteContactTarget(
												contacts.find((entry) => entry.uuid === row.uuid) ?? null
											);
										},
										screenReaderLabel: (row): string => row.name,
										variant: "button",
									},
								]}
							/>
						)}
					</div>
				</div>
			) : null}

			<ConfirmDialog
				cancelLabel={t("workspaces.cancelAction")}
				confirmLabel={t("workspaces.appInfoDelete")}
				isOpen={deleteApplicationInformationDialogOpen}
				isPending={isDeletingApplicationInformation}
				title={t("workspaces.appInfoDeleteConfirmTitle")}
				description={t("workspaces.appInfoDeleteConfirmBody", {
					name: applicationInformation?.serviceNameEn ?? "",
				})}
				onClose={() => {
					setDeleteApplicationInformationDialogOpen(false);
				}}
				onConfirm={() => {
					void handleDeleteApplicationInformation();
				}}
			/>

			<ConfirmDialog
				cancelLabel={t("workspaces.cancelAction")}
				confirmLabel={t("workspaces.appInfoContactDelete")}
				isOpen={deleteContactTarget !== null}
				isPending={isDeleting}
				title={t("workspaces.appInfoContactDeleteConfirmTitle")}
				description={t("workspaces.appInfoContactDeleteConfirmBody", {
					name: deleteContactTarget?.nameEn ?? "",
				})}
				onClose={() => {
					setDeleteContactTarget(null);
				}}
				onConfirm={() => {
					void handleDeleteContact();
				}}
			/>
		</>
	);
};