import { useState } from "react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, ConfirmDialog, Heading, Notice, Text } from "@/components/ui";
import { hasCapability } from "@/features/auth/authorization";
import { getRequestErrorNotice } from "@/fetch";
import type { ApplicationInformationContactRead } from "@/fetch/workspaces";
import { useSession } from "@/hooks";
import {
	getApplicationInformationContactDisplayName,
	getApplicationInformationContactResponsibility,
} from "../application-information-contact-display";
import { useApplicationInformationContacts } from "../hooks/use-application-information-contacts";
import { useWorkspaceApplicationInformation } from "../hooks/use-workspace-application-information";

export const ApplicationInformationContactsPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation() as unknown as {
		i18n: { resolvedLanguage?: string };
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const { currentUser } = useSession();
	const { applicationInformationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/contacts/",
	});
	const search = useSearch({
		from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/contacts",
	});
	const {
		applicationInformation,
		error: applicationError,
		isLoading: isLoadingApplication,
	} = useWorkspaceApplicationInformation(
		workspaceUuid,
		applicationInformationUuid
	);
	const {
		contacts,
		error: contactsError,
		isDeleting,
		isLoading: isLoadingContacts,
		removeContact,
	} = useApplicationInformationContacts(
		workspaceUuid,
		applicationInformationUuid
	);
	const [deleteTarget, setDeleteTarget] =
		useState<ApplicationInformationContactRead | null>(null);
	const [localError, setLocalError] = useState<Error | null>(null);
	const [deletedSuccessfully, setDeletedSuccessfully] = useState(false);
	const canEdit = hasCapability(
		currentUser?.authorizationContext,
		"application_information_write",
		workspaceUuid
	);
	const errorNotice = getRequestErrorNotice(
		localError ?? contactsError ?? applicationError,
		{
			bodyKey: "workspaces.appInfoErrorBody",
			titleKey: "workspaces.appInfoErrorTitle",
		}
	);
	const successMessage = deletedSuccessfully
		? t("workspaces.appInfoContactDeletedSuccess")
		: search.created === "1"
			? t("workspaces.appInfoContactCreatedSuccess")
			: search.updated === "1"
				? t("workspaces.appInfoContactUpdatedSuccess")
				: null;
	const applicationName = applicationInformation
		? i18n.resolvedLanguage?.startsWith("fr")
			? applicationInformation.serviceNameFr
			: applicationInformation.serviceNameEn
		: null;
	const getContactName = (contact: ApplicationInformationContactRead): string =>
		getApplicationInformationContactDisplayName(
			contact,
			i18n.resolvedLanguage,
			t("common.notAvailable")
		);

	const handleDelete = async (): Promise<void> => {
		if (!deleteTarget) {
			return;
		}

		setLocalError(null);
		setDeletedSuccessfully(false);

		try {
			await removeContact(deleteTarget.uuid);
			setDeleteTarget(null);
			setDeletedSuccessfully(true);
			await navigate({
				params: { applicationInformationUuid, workspaceUuid },
				replace: true,
				search: {},
				to: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/contacts",
			});
		} catch (requestError) {
			setDeleteTarget(null);
			setLocalError(requestError as Error);
		}
	};

	return (
		<>
			<Heading tag="h1">
				{applicationName
					? t("workspaces.appInfoContactsPageTitle", {
							name: applicationName,
						})
					: t("workspaces.appInfoContacts")}
			</Heading>
			<Text>
				{t(
					canEdit
						? "workspaces.appInfoContactsSummary"
						: "workspaces.appInfoContactsReadOnlySummary"
				)}
			</Text>

			{successMessage ? (
				<Notice
					noticeRole="success"
					noticeTitle={successMessage}
					noticeTitleTag="h2"
				>
					<Text>{successMessage}</Text>
				</Notice>
			) : null}

			{isLoadingApplication || isLoadingContacts ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("workspaces.appInfoContactsLoadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.appInfoContactsLoadingBody")}</Text>
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

			<div className="grid gap-300">
				{canEdit ? (
					<div>
						<Button
							href={`/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/contacts/new`}
							type="link"
						>
							{t("workspaces.appInfoCreateContact")}
						</Button>
					</div>
				) : null}

				{!isLoadingContacts && !contactsError && contacts.length === 0 ? (
					<Notice
						noticeRole="info"
						noticeTitle={t("workspaces.appInfoNoContactsTitle")}
						noticeTitleTag="h2"
					>
						<Text>{t("workspaces.appInfoNoContactsBody")}</Text>
					</Notice>
				) : null}

				{contacts.length > 0 ? (
					<ul className="grid gap-300 list-none pl-0">
						{contacts.map((contact) => {
							const contactName = getContactName(contact);

							return (
								<li
									key={contact.uuid}
									className="grid gap-200 rounded-sm border border-solid border-[#d9d9d9] p-300"
								>
									<Heading tag="h2">{contactName}</Heading>
									<dl className="grid gap-150">
										<div>
											<dt>
												<strong>
													{t(
														"workspaces.appInfoContactConfirmationStatusLabel"
													)}
												</strong>
											</dt>
											<dd>
												{t(
													contact.identityConfirmationRequired
														? "workspaces.appInfoContactConfirmationRequired"
														: "workspaces.appInfoContactConfirmationComplete"
												)}
											</dd>
										</div>
										<div>
											<dt>
												<strong>
													{t("workspaces.appInfoContactResponsibilityLabel")}
												</strong>
											</dt>
											<dd>
												{getApplicationInformationContactResponsibility(
													contact,
													i18n.resolvedLanguage
												)}
											</dd>
										</div>
										<div>
											<dt>
												<strong>
													{t("workspaces.appInfoContactEmailLabel")}
												</strong>
											</dt>
											<dd>{contact.email}</dd>
										</div>
									</dl>

									{canEdit ? (
										<div className="flex flex-wrap gap-200">
											<Button
												buttonRole="secondary"
												href={`/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}/contacts/${contact.uuid}/edit`}
												type="link"
											>
												{t("workspaces.appInfoContactEdit")}
											</Button>
											<Button
												buttonRole="danger"
												type="button"
												onGcdsClick={() => {
													setDeleteTarget(contact);
												}}
											>
												{t("workspaces.appInfoContactDelete")}
											</Button>
										</div>
									) : null}
								</li>
							);
						})}
					</ul>
				) : null}

				<div>
					<Button
						buttonRole="secondary"
						href={`/workspaces/${workspaceUuid}/applications/${applicationInformationUuid}`}
						type="link"
					>
						{t("workspaces.appInfoContactsBackToApplication")}
					</Button>
				</div>
			</div>

			{canEdit ? (
				<ConfirmDialog
					cancelLabel={t("workspaces.cancelAction")}
					confirmLabel={t("workspaces.appInfoContactDelete")}
					isOpen={deleteTarget !== null}
					isPending={isDeleting}
					title={t("workspaces.appInfoContactDeleteConfirmTitle")}
					description={t("workspaces.appInfoContactDeleteConfirmBody", {
						name: deleteTarget ? getContactName(deleteTarget) : "",
					})}
					onClose={() => {
						setDeleteTarget(null);
					}}
					onConfirm={() => {
						void handleDelete();
					}}
				/>
			) : null}
		</>
	);
};
