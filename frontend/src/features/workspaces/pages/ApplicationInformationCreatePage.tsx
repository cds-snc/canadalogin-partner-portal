import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import {
	createEmptyApplicationInformationForm,
	toApplicationInformationCreatePayload,
	type ApplicationInformationFormState,
} from "../application-information-form";
import { ApplicationInformationForm } from "../components/ApplicationInformationForm";
import { useApplicationInformationManagement } from "../hooks/use-application-information-management";

export const ApplicationInformationCreatePage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const { workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/new",
	});
	const { createApplicationInformation, isCreating } =
		useApplicationInformationManagement();
	const [error, setError] = useState<Error | null>(null);
	const [form, setForm] = useState<ApplicationInformationFormState>(
		createEmptyApplicationInformationForm
	);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "workspaces.appInfoErrorBody",
		titleKey: "workspaces.appInfoErrorTitle",
	});

	const updateFormField = (
		field: keyof ApplicationInformationFormState,
		value: string
	): void => {
		setForm((currentForm) => ({ ...currentForm, [field]: value }));
	};

	const handleCreateApplicationInformation = async (): Promise<void> => {
		setError(null);

		try {
			const applicationInformation = await createApplicationInformation(
				workspaceUuid,
				toApplicationInformationCreatePayload(form)
			);

			await navigate({
				params: {
					applicationInformationUuid: applicationInformation.uuid,
					workspaceUuid,
				},
				replace: true,
				search: { created: "1" },
				to: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid",
			});
		} catch (requestError) {
			setError(requestError as Error);
		}
	};

	return (
		<>
			<Heading tag="h1">{t("workspaces.appInfoCreatePageTitle")}</Heading>
			<Text>{t("workspaces.appInfoCreateSummary")}</Text>

			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey)}</Text>
				</Notice>
			) : null}

			<ApplicationInformationForm
				cancelHref={`/workspaces/${workspaceUuid}/applications`}
				form={form}
				isSubmitting={isCreating}
				submitLabel={
					isCreating
						? t("workspaces.appInfoSavingAction")
						: t("workspaces.appInfoCreateButton")
				}
				onChange={updateFormField}
				onSubmit={() => {
					void handleCreateApplicationInformation();
				}}
			/>
		</>
	);
};
