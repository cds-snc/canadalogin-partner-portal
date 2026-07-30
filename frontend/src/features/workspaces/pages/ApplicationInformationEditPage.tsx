import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import {
	createEmptyApplicationInformationForm,
	toApplicationInformationFormState,
	toApplicationInformationUpdatePayload,
	type ApplicationInformationFormState,
} from "../application-information-form";
import { ApplicationInformationForm } from "../components/ApplicationInformationForm";
import { useApplicationInformationManagement } from "../hooks/use-application-information-management";
import { useWorkspaceApplicationInformation } from "../hooks/use-workspace-application-information";

type ApplicationInformationFormDraft = {
	sourceUuid: string;
	values: Partial<ApplicationInformationFormState>;
};

export const ApplicationInformationEditPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const { applicationInformationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/application-information/$applicationInformationUuid/edit",
	});
	const {
		applicationInformation,
		error: loadError,
		isLoading,
	} = useWorkspaceApplicationInformation(
		workspaceUuid,
		applicationInformationUuid
	);
	const { isUpdating, updateApplicationInformation } =
		useApplicationInformationManagement();
	const [formDraft, setFormDraft] = useState<ApplicationInformationFormDraft | null>(
		null
	);
	const [submitError, setSubmitError] = useState<Error | null>(null);
	const errorNotice = getRequestErrorNotice(submitError ?? loadError, {
		bodyKey: "workspaces.appInfoErrorBody",
		titleKey: "workspaces.appInfoErrorTitle",
	});
	const formSourceUuid = applicationInformation?.uuid ?? applicationInformationUuid;
	const formOverrides =
		formDraft?.sourceUuid === formSourceUuid ? formDraft.values : {};
	const form: ApplicationInformationFormState = {
		...createEmptyApplicationInformationForm(),
		...(applicationInformation
			? toApplicationInformationFormState(applicationInformation)
			: {}),
		...formOverrides,
	};

	const updateFormField = (
		field: keyof ApplicationInformationFormState,
		value: string
	): void => {
		setFormDraft((currentDraft) => ({
			sourceUuid: formSourceUuid,
			values: {
				...(currentDraft?.sourceUuid === formSourceUuid
					? currentDraft.values
					: {}),
				[field]: value,
			},
		}));
	};

	const handleUpdateApplicationInformation = async (): Promise<void> => {
		setSubmitError(null);

		try {
			const updatedApplicationInformation = await updateApplicationInformation(
				workspaceUuid,
				applicationInformationUuid,
				toApplicationInformationUpdatePayload(form)
			);

			await navigate({
				params: {
					applicationInformationUuid: updatedApplicationInformation.uuid,
					workspaceUuid,
				},
				replace: true,
				search: { updated: "1" },
				to: "/workspaces/$workspaceUuid/application-information/$applicationInformationUuid",
			});
		} catch (requestError) {
			setSubmitError(requestError as Error);
		}
	};

	return (
		<>
			<Heading tag="h1">
				{applicationInformation
					? t("workspaces.appInfoEditPageTitle", {
							name: applicationInformation.serviceNameEn,
						})
					: t("workspaces.appInfoEdit")}
			</Heading>
			<Text>{t("workspaces.appInfoEditSummary")}</Text>

			{isLoading ? (
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
				<ApplicationInformationForm
					cancelHref={`/workspaces/${workspaceUuid}/application-information/${applicationInformationUuid}`}
					form={form}
					isSubmitting={isUpdating}
					submitLabel={
						isUpdating
							? t("workspaces.appInfoSavingAction")
							: t("workspaces.appInfoSaveAction")
					}
					onChange={updateFormField}
					onSubmit={() => {
						void handleUpdateApplicationInformation();
					}}
				/>
			) : null}
		</>
	);
};