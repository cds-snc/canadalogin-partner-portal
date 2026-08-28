import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import {
	createEmptyApplicationInformationContactForm,
	toApplicationInformationContactCreatePayload,
	type ApplicationInformationContactFormState,
} from "../application-information-contact-form";
import { ApplicationInformationContactForm } from "../components/ApplicationInformationContactForm";
import { useApplicationInformationContacts } from "../hooks/use-application-information-contacts";

export const ApplicationInformationContactCreatePage =
	(): FunctionComponent => {
		const { t } = useTranslation() as unknown as {
			t: (
				key: string | Array<string>,
				options?: Record<string, unknown>
			) => string;
		};
		const navigate = useNavigate();
		const { applicationInformationUuid, workspaceUuid } = useParams({
			from: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/contacts/new",
		});
		const { addContact, isAdding } = useApplicationInformationContacts(
			workspaceUuid,
			applicationInformationUuid
		);
		const [form, setForm] = useState<ApplicationInformationContactFormState>(
			createEmptyApplicationInformationContactForm
		);
		const [error, setError] = useState<Error | null>(null);
		const errorNotice = getRequestErrorNotice(error, {
			bodyKey: "workspaces.appInfoErrorBody",
			titleKey: "workspaces.appInfoErrorTitle",
		});

		const navigateToContacts = async (created = false): Promise<void> => {
			await navigate({
				params: { applicationInformationUuid, workspaceUuid },
				search: created ? { created: "1" } : {},
				to: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/contacts",
			});
		};

		const handleCreate = async (): Promise<void> => {
			setError(null);

			try {
				await addContact(toApplicationInformationContactCreatePayload(form));
				await navigateToContacts(true);
			} catch (requestError) {
				setError(requestError as Error);
			}
		};

		return (
			<>
				<Heading tag="h1">
					{t("workspaces.appInfoContactCreatePageTitle")}
				</Heading>
				<Text>{t("workspaces.appInfoContactCreatePageSummary")}</Text>

				{errorNotice ? (
					<Notice
						noticeRole={errorNotice.noticeRole}
						noticeTitle={t(errorNotice.titleKey)}
						noticeTitleTag="h2"
					>
						<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey)}</Text>
					</Notice>
				) : null}

				<ApplicationInformationContactForm
					form={form}
					isSubmitting={isAdding}
					submitLabel={
						isAdding
							? t("workspaces.appInfoSavingContactAction")
							: t("workspaces.appInfoCreateContact")
					}
					onCancel={() => {
						void navigateToContacts();
					}}
					onChange={(field, value) => {
						setForm((currentForm) => ({
							...currentForm,
							[field]: value,
						}));
					}}
					onSubmit={() => {
						void handleCreate();
					}}
				/>
			</>
		);
	};
