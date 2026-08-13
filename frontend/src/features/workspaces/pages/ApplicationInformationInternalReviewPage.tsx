import { Fragment, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import {
	Button,
	Grid,
	Heading,
	Notice,
	Select,
	Text,
	Textarea,
} from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import type {
	ApplicationInformationReviewChecklistStatus,
	ApplicationInformationReviewDisposition,
} from "@/fetch/workspaces";
import { useApplicationInformationReview } from "../hooks/use-application-information-review";
import { useWorkspaceApplicationInformation } from "../hooks/use-workspace-application-information";

type Translate = (
	key: string | Array<string>,
	options?: Record<string, unknown>
) => string;

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

const STATUS_FIELDS: Array<{
	field: Exclude<
		keyof ReviewChecklistFormState,
		"rationale" | "reviewDisposition"
	>;
	labelKey: string;
}> = [
	{
		field: "applicationInformationStatus",
		labelKey: "workspaces.appInfoInternalReviewApplicationInformationLabel",
	},
	{
		field: "contactsStatus",
		labelKey: "workspaces.appInfoReadinessContactsLabel",
	},
	{
		field: "environmentRegistrationStatus",
		labelKey: "workspaces.appInfoInternalReviewEnvironmentRegistrationLabel",
	},
	{
		field: "promotionMetadataStatus",
		labelKey: "workspaces.appInfoInternalReviewPromotionMetadataLabel",
	},
	{
		field: "evidenceReferenceStatus",
		labelKey: "workspaces.appInfoInternalReviewEvidenceReferenceLabel",
	},
	{
		field: "processLinksStatus",
		labelKey: "workspaces.appInfoInternalReviewProcessLinksLabel",
	},
];

const emptyChecklist = (): ReviewChecklistFormState => ({
	applicationInformationStatus: "not_started",
	contactsStatus: "not_started",
	environmentRegistrationStatus: "not_started",
	evidenceReferenceStatus: "not_started",
	processLinksStatus: "not_started",
	promotionMetadataStatus: "not_started",
	rationale: "",
	reviewDisposition: "pending",
});

const getChecklistStatusLabel = (
	t: Translate,
	status: ApplicationInformationReviewChecklistStatus
): string => {
	switch (status) {
		case "complete":
			return t("workspaces.appInfoReadinessStatusComplete");
		case "incomplete":
			return t("workspaces.appInfoReadinessStatusIncomplete");
		case "not_started":
		default:
			return t("workspaces.appInfoReadinessStatusNotStarted");
	}
};

const getReviewDispositionLabel = (
	t: Translate,
	disposition: ApplicationInformationReviewDisposition
): string => {
	switch (disposition) {
		case "changes_requested":
			return t("workspaces.appInfoInternalReviewDispositionChangesRequested");
		case "ready_for_next_step":
			return t("workspaces.appInfoInternalReviewDispositionReadyForNextStep");
		case "pending":
		default:
			return t("workspaces.appInfoInternalReviewDispositionPending");
	}
};

const formatReviewDate = (value: string, locale: string): string =>
	new Intl.DateTimeFormat(locale, {
		dateStyle: "long",
		timeStyle: "short",
	}).format(new Date(value));

type ReviewChecklistEditorProps = {
	initialForm: ReviewChecklistFormState;
	isSaving: boolean;
	onSave: (form: ReviewChecklistFormState) => Promise<void>;
	t: Translate;
};

const ReviewChecklistEditor = ({
	initialForm,
	isSaving,
	onSave,
	t,
}: ReviewChecklistEditorProps): FunctionComponent => {
	const [form, setForm] = useState(initialForm);

	return (
		<div className="grid gap-200 rounded-sm border border-solid border-[#d9d9d9] p-200">
			<Select
				label={t("workspaces.appInfoInternalReviewDispositionLabel")}
				name="reviewDisposition"
				selectId="review-disposition"
				value={form.reviewDisposition}
				onInput={(event): void => {
					setForm((current) => ({
						...current,
						reviewDisposition: (event.target as HTMLSelectElement)
							.value as ApplicationInformationReviewDisposition,
					}));
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

			{STATUS_FIELDS.map(({ field, labelKey }) => (
				<Select
					key={field}
					label={t(labelKey)}
					name={field}
					selectId={`review-${field}`}
					value={form[field]}
					onInput={(event): void => {
						setForm((current) => ({
							...current,
							[field]: (event.target as HTMLSelectElement)
								.value as ApplicationInformationReviewChecklistStatus,
						}));
					}}
				>
					<option value="not_started">
						{t("workspaces.appInfoReadinessStatusNotStarted")}
					</option>
					<option value="incomplete">
						{t("workspaces.appInfoReadinessStatusIncomplete")}
					</option>
					<option value="complete">
						{t("workspaces.appInfoReadinessStatusComplete")}
					</option>
				</Select>
			))}

			<Textarea
				label={t("workspaces.appInfoInternalReviewRationaleLabel")}
				name="rationale"
				textareaId="review-rationale"
				value={form.rationale}
				onInput={(event): void => {
					setForm((current) => ({
						...current,
						rationale: (event.target as HTMLTextAreaElement).value,
					}));
				}}
			/>
			<div>
				<Button
					disabled={isSaving}
					type="button"
					onGcdsClick={() => {
						void onSave(form);
					}}
				>
					{isSaving
						? t("workspaces.appInfoInternalReviewChecklistSavingAction")
						: t("workspaces.appInfoInternalReviewChecklistSaveAction")}
				</Button>
			</div>
		</div>
	);
};

export const ApplicationInformationInternalReviewPage =
	(): FunctionComponent => {
		const { i18n, t } = useTranslation() as unknown as {
			i18n: { resolvedLanguage?: string };
			t: Translate;
		};
		const { applicationInformationUuid, workspaceUuid } = useParams({
			from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/internal-review",
		});
		const { applicationInformation, error: applicationError } =
			useWorkspaceApplicationInformation(
				workspaceUuid,
				applicationInformationUuid
			);
		const {
			addNote,
			checklistSummary,
			error: reviewError,
			isAddingNote,
			isLoading,
			isSavingChecklist,
			notes,
			saveChecklistSummary,
		} = useApplicationInformationReview(
			workspaceUuid,
			applicationInformationUuid,
			true
		);
		const [noteBody, setNoteBody] = useState("");
		const [localError, setLocalError] = useState<Error | null>(null);
		const [successMessage, setSuccessMessage] = useState<string | null>(null);
		const errorNotice = getRequestErrorNotice(
			localError ?? reviewError ?? applicationError,
			{
				bodyKey: "workspaces.appInfoInternalReviewErrorBody",
				titleKey: "workspaces.appInfoInternalReviewErrorTitle",
			}
		);
		const checklistForm: ReviewChecklistFormState = checklistSummary
			? {
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
				}
			: emptyChecklist();
		const canEdit =
			applicationInformation?.onboardingState === "submitted" ||
			applicationInformation?.onboardingState === "under_review";
		const locale = i18n.resolvedLanguage?.startsWith("fr") ? "fr-CA" : "en-CA";

		const handleSaveChecklist = async (
			form: ReviewChecklistFormState
		): Promise<void> => {
			setLocalError(null);
			setSuccessMessage(null);

			try {
				await saveChecklistSummary({
					...form,
					rationale: form.rationale.trim() || null,
				});
				setSuccessMessage(
					t("workspaces.appInfoInternalReviewChecklistSavedSuccess")
				);
			} catch (requestError) {
				setLocalError(requestError as Error);
			}
		};

		const handleSaveNote = async (): Promise<void> => {
			const body = noteBody.trim();
			if (!body) {
				return;
			}

			setLocalError(null);
			setSuccessMessage(null);

			try {
				await addNote({ body });
				setNoteBody("");
				setSuccessMessage(
					t("workspaces.appInfoInternalReviewNoteSavedSuccess")
				);
			} catch (requestError) {
				setLocalError(requestError as Error);
			}
		};

		return (
			<>
				<Heading tag="h1">{t("workspaces.appInfoInternalReviewTitle")}</Heading>
				<Text>{t("workspaces.appInfoInternalReviewSummary")}</Text>

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
						noticeTitle={t("workspaces.appInfoInternalReviewLoadingTitle")}
						noticeTitleTag="h2"
					>
						<Text>{t("workspaces.appInfoInternalReviewLoadingBody")}</Text>
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

				{!isLoading && !errorNotice ? (
					<div className="grid gap-400">
						<section className="grid gap-200">
							<Heading tag="h2">
								{t("workspaces.appInfoInternalReviewChecklistTitle")}
							</Heading>
							{checklistSummary ? (
								<Grid columns="1fr" columnsDesktop="18rem 1fr" tag="dl">
									<dt>
										<strong>
											{t("workspaces.appInfoInternalReviewDispositionLabel")}
										</strong>
									</dt>
									<dd>
										{getReviewDispositionLabel(
											t,
											checklistSummary.reviewDisposition
										)}
									</dd>
									{STATUS_FIELDS.map(({ field, labelKey }) => (
										<Fragment key={field}>
											<dt>
												<strong>{t(labelKey)}</strong>
											</dt>
											<dd>
												{getChecklistStatusLabel(t, checklistSummary[field])}
											</dd>
										</Fragment>
									))}
									<dt>
										<strong>
											{t("workspaces.appInfoInternalReviewRationaleLabel")}
										</strong>
									</dt>
									<dd>
										{checklistSummary.rationale ?? t("common.notAvailable")}
									</dd>
									<dt>
										<strong>
											{t("workspaces.appInfoInternalReviewReviewedByLabel")}
										</strong>
									</dt>
									<dd>
										{checklistSummary.reviewedByName ??
											t("common.notAvailable")}
									</dd>
									<dt>
										<strong>
											{t("workspaces.appInfoInternalReviewUpdatedAtLabel")}
										</strong>
									</dt>
									<dd>
										{formatReviewDate(
											checklistSummary.updatedAt ?? checklistSummary.createdAt,
											locale
										)}
									</dd>
								</Grid>
							) : (
								<Notice
									noticeRole="info"
									noticeTitleTag="h3"
									noticeTitle={t(
										"workspaces.appInfoInternalReviewNoChecklistTitle"
									)}
								>
									<Text>
										{t("workspaces.appInfoInternalReviewNoChecklistBody")}
									</Text>
								</Notice>
							)}

							{canEdit ? (
								<ReviewChecklistEditor
									key={
										checklistSummary?.updatedAt ??
										checklistSummary?.createdAt ??
										"empty"
									}
									initialForm={checklistForm}
									isSaving={isSavingChecklist}
									t={t}
									onSave={handleSaveChecklist}
								/>
							) : (
								<Notice
									noticeRole="info"
									noticeTitleTag="h3"
									noticeTitle={t(
										"workspaces.appInfoInternalReviewReadOnlyTitle"
									)}
								>
									<Text>
										{t("workspaces.appInfoInternalReviewReadOnlyBody")}
									</Text>
								</Notice>
							)}
						</section>

						<section className="grid gap-200">
							<Heading tag="h2">
								{t("workspaces.appInfoInternalReviewNotesTitle")}
							</Heading>
							{notes.length > 0 ? (
								<ul className="grid gap-150 list-none pl-0">
									{notes.map((note) => (
										<li
											key={note.uuid}
											className="rounded-sm border border-solid border-[#d9d9d9] p-200"
										>
											<Text>
												{`${note.authorName ?? t("common.notAvailable")} - ${formatReviewDate(
													note.createdAt,
													locale
												)}`}
											</Text>
											<Text>{note.body}</Text>
										</li>
									))}
								</ul>
							) : (
								<Notice
									noticeRole="info"
									noticeTitleTag="h3"
									noticeTitle={t(
										"workspaces.appInfoInternalReviewNoNotesTitle"
									)}
								>
									<Text>
										{t("workspaces.appInfoInternalReviewNoNotesBody")}
									</Text>
								</Notice>
							)}

							{canEdit ? (
								<div className="grid gap-150 rounded-sm border border-solid border-[#d9d9d9] p-200">
									<Textarea
										label={t("workspaces.appInfoInternalReviewNoteLabel")}
										name="reviewNote"
										textareaId="review-note-body"
										value={noteBody}
										onInput={(event): void => {
											setNoteBody((event.target as HTMLTextAreaElement).value);
										}}
									/>
									<div>
										<Button
											buttonRole="secondary"
											disabled={isAddingNote || !noteBody.trim()}
											type="button"
											onGcdsClick={() => {
												void handleSaveNote();
											}}
										>
											{isAddingNote
												? t("workspaces.appInfoInternalReviewNoteSavingAction")
												: t("workspaces.appInfoInternalReviewNoteSaveAction")}
										</Button>
									</div>
								</div>
							) : null}
						</section>
					</div>
				) : null}

				<div className="mt-300">
					<Button
						buttonRole="secondary"
						href={`/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}`}
						type="link"
					>
						{t("workspaces.appInfoBackToApplication")}
					</Button>
				</div>
			</>
		);
	};
