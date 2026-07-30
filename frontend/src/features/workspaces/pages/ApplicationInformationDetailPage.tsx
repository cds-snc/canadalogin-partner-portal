import { useState } from "react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import {
	Button,
	ConfirmDialog,
	DataTable,
	Heading,
	Notice,
	Text,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { getRequestErrorNotice } from "@/fetch";
import type { ApplicationInformationContactRead } from "@/fetch/workspaces";
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
import { useWorkspaceApplicationInformation } from "../hooks/use-workspace-application-information";

type ContactRow = {
	email: string;
	name: string;
	phoneNumber: string;
	responsibility: string;
	uuid: string;
};

export const ApplicationInformationDetailPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
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
	const [contactForm, setContactForm] =
		useState<ApplicationInformationContactFormState>(
			createEmptyApplicationInformationContactForm
		);
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
					<Heading tag="h2">{t("workspaces.appInfoSectionTitle")}</Heading>
					<Text>{`${t("workspaces.appInfoServiceNameEnLabel")}: ${applicationInformation.serviceNameEn}`}</Text>
					<Text>{`${t("workspaces.appInfoServiceNameFrLabel")}: ${applicationInformation.serviceNameFr}`}</Text>
					<Text>{`${t("workspaces.appInfoOverviewLabel")}: ${applicationInformation.overview}`}</Text>
					<Text>{`${t("workspaces.appInfoTechnologyAndProtocolLabel")}: ${applicationInformation.technologyAndProtocol}`}</Text>
					<Text>{`${t("workspaces.appInfoSecurityAndPrivacyLabel")}: ${applicationInformation.securityAndPrivacy}`}</Text>
					<Text>{`${t("workspaces.appInfoUsageLabel")}: ${applicationInformation.usage}`}</Text>
					<Text>{`${t("workspaces.appInfoMigrationOrTransitionPlanLabel")}: ${applicationInformation.migrationOrTransitionPlan}`}</Text>
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