import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import {
	createEmptyApplicationInformationContactForm,
	toApplicationInformationContactFormState,
	toApplicationInformationContactUpdatePayload,
	type ApplicationInformationContactFormState,
} from "../application-information-contact-form";
import { getApplicationInformationContactDisplayName } from "../application-information-contact-display";
import { ApplicationInformationContactForm } from "../components/ApplicationInformationContactForm";
import { useApplicationInformationContacts } from "../hooks/use-application-information-contacts";

type ContactFormDraft = {
	sourceUuid: string;
	values: Partial<ApplicationInformationContactFormState>;
};

export const ApplicationInformationContactEditPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation() as unknown as {
		i18n: { resolvedLanguage?: string };
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const { applicationInformationUuid, contactUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/contacts/$contactUuid/edit",
	});
	const {
		contacts,
		error: loadError,
		isLoading,
		isUpdating,
		updateContact,
	} = useApplicationInformationContacts(
		workspaceUuid,
		applicationInformationUuid
	);
	const contact = contacts.find((entry) => entry.uuid === contactUuid) ?? null;
	const [formDraft, setFormDraft] = useState<ContactFormDraft | null>(null);
	const [submitError, setSubmitError] = useState<Error | null>(null);
	const formOverrides =
		formDraft?.sourceUuid === contactUuid ? formDraft.values : {};
	const form: ApplicationInformationContactFormState = {
		...createEmptyApplicationInformationContactForm(),
		...(contact ? toApplicationInformationContactFormState(contact) : {}),
		...formOverrides,
	};
	const errorNotice = getRequestErrorNotice(submitError ?? loadError, {
		bodyKey: "workspaces.appInfoErrorBody",
		titleKey: "workspaces.appInfoErrorTitle",
	});
	const contactName = contact
		? getApplicationInformationContactDisplayName(
				contact,
				i18n.resolvedLanguage,
				t("common.notAvailable")
			)
		: null;

	const navigateToContacts = async (updated = false): Promise<void> => {
		await navigate({
			params: { applicationInformationUuid, workspaceUuid },
			replace: updated,
			search: updated ? { updated: "1" } : {},
			to: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/contacts",
		});
	};

	const handleUpdate = async (): Promise<void> => {
		if (!contact) {
			return;
		}

		setSubmitError(null);

		try {
			await updateContact(
				contact.uuid,
				toApplicationInformationContactUpdatePayload(form)
			);
			await navigateToContacts(true);
		} catch (requestError) {
			setSubmitError(requestError as Error);
		}
	};

	return (
		<>
			<Heading tag="h1">
				{contactName
					? t("workspaces.appInfoContactEditPageTitle", {
							name: contactName,
						})
					: t("workspaces.appInfoContactEdit")}
			</Heading>
			<Text>{t("workspaces.appInfoContactEditPageSummary")}</Text>

			{isLoading ? (
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

			{!isLoading && !loadError && !contact ? (
				<Notice
					noticeRole="danger"
					noticeTitle={t("workspaces.appInfoContactNotFoundTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.appInfoContactNotFoundBody")}</Text>
				</Notice>
			) : null}

			{contact ? (
				<ApplicationInformationContactForm
					form={form}
					isSubmitting={isUpdating}
					submitLabel={
						isUpdating
							? t("workspaces.appInfoSavingContactAction")
							: t("workspaces.appInfoContactSaveAction")
					}
					onCancel={() => {
						void navigateToContacts();
					}}
					onChange={(field, value) => {
						setFormDraft((currentDraft) => ({
							sourceUuid: contactUuid,
							values: {
								...(currentDraft?.sourceUuid === contactUuid
									? currentDraft.values
									: {}),
								[field]: value,
							},
						}));
					}}
					onSubmit={() => {
						void handleUpdate();
					}}
				/>
			) : null}
		</>
	);
};
