import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { WorkspaceRPApplicationForm } from "../components/WorkspaceRPApplicationForm";
import { useWorkspaceApplicationInformationList } from "../hooks/use-workspace-application-information";
import { useWorkspaceRPApplicationManagement } from "../hooks/use-workspace-rp-application-management";
import { useWorkspaceRPApplication } from "../hooks/use-workspace-rp-applications";
import {
	createEmptyWorkspaceRPApplicationForm,
	toRPApplicationUpdatePayload,
	toWorkspaceRPApplicationFormState,
	validateWorkspaceRPApplicationForm,
	type WorkspaceRPApplicationFormState,
	type WorkspaceRPApplicationValidationMessageKey,
} from "../workspace-rp-application-form";

type WorkspaceApplicationFormDraft = {
	sourceUuid: string;
	values: Partial<WorkspaceRPApplicationFormState>;
};

export const WorkspaceApplicationEditPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const { rpApplicationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid/edit",
	});
	const {
		application,
		error: loadError,
		isLoading,
	} = useWorkspaceRPApplication(workspaceUuid, rpApplicationUuid);
	const { applicationInformationRecords } =
		useWorkspaceApplicationInformationList(workspaceUuid);
	const { isUpdating, updateRPApplication } =
		useWorkspaceRPApplicationManagement();
	const [formDraft, setFormDraft] =
		useState<WorkspaceApplicationFormDraft | null>(null);
	const [validationMessageKeys, setValidationMessageKeys] = useState<
		Array<WorkspaceRPApplicationValidationMessageKey>
	>([]);
	const [submitError, setSubmitError] = useState<Error | null>(null);
	const linkedApplicationInformationUuid =
		application?.application_information_id
			? (applicationInformationRecords.find(
					(applicationInformation) =>
						applicationInformation.id === application.application_information_id
				)?.uuid ?? null)
			: null;
	const formSourceUuid = application?.uuid ?? rpApplicationUuid;
	const formOverrides =
		formDraft?.sourceUuid === formSourceUuid ? formDraft.values : {};
	const form: WorkspaceRPApplicationFormState = {
		...createEmptyWorkspaceRPApplicationForm(),
		...(application
			? toWorkspaceRPApplicationFormState(
					application,
					linkedApplicationInformationUuid
				)
			: {}),
		...formOverrides,
	};
	const errorNotice = getRequestErrorNotice(submitError ?? loadError, {
		bodyKey: "workspaces.applicationsErrorBody",
		titleKey: "workspaces.applicationsErrorTitle",
	});

	const updateFormField = (
		field: keyof WorkspaceRPApplicationFormState,
		value: string | Array<string>
	): void => {
		setValidationMessageKeys([]);
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

	const handleUpdateApplication = async (): Promise<void> => {
		setSubmitError(null);
		const validationErrors = validateWorkspaceRPApplicationForm(form);
		if (validationErrors.length > 0) {
			setValidationMessageKeys(validationErrors);
			return;
		}

		try {
			const updatedApplication = await updateRPApplication(
				workspaceUuid,
				rpApplicationUuid,
				toRPApplicationUpdatePayload(form)
			);

			await navigate({
				params: {
					rpApplicationUuid: updatedApplication.uuid,
					workspaceUuid,
				},
				replace: true,
				search: { updated: "1" },
				to: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid",
			});
		} catch (requestError) {
			setSubmitError(requestError as Error);
		}
	};

	return (
		<>
			<Heading tag="h1">
				{application
					? t("workspaces.applicationsEditPageTitle", {
							name: application.dnr_app_name,
						})
					: t("workspaces.applicationsSectionTitle")}
			</Heading>
			<Text>{t("workspaces.applicationsEditSummary")}</Text>

			{validationMessageKeys.length > 0 ? (
				<Notice
					noticeRole="danger"
					noticeTitle={t("workspaces.applicationsValidationErrorTitle")}
					noticeTitleTag="h2"
				>
					<ul className="list-disc pl-300">
						{validationMessageKeys.map((messageKey) => (
							<li key={messageKey}>{t(messageKey)}</li>
						))}
					</ul>
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
				<WorkspaceRPApplicationForm
					cancelHref={`/workspaces/${workspaceUuid}/applications/${rpApplicationUuid}`}
					form={form}
					isSubmitting={isUpdating}
					applicationInformationOptions={applicationInformationRecords.map(
						(applicationInformation) => ({
							label: applicationInformation.serviceNameEn,
							value: applicationInformation.uuid,
						})
					)}
					submitLabel={
						isUpdating
							? t("workspaces.applicationsSavingAction")
							: t("workspaces.applicationsSaveAction")
					}
					onChange={updateFormField}
					onSubmit={() => {
						void handleUpdateApplication();
					}}
				/>
			) : null}
		</>
	);
};
