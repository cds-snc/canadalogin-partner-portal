import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import {
	Button,
	DataTable,
	ErrorSummary,
	Heading,
	Link,
	Notice,
	Select,
	Text,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import {
	getRequestErrorNotice,
	isConflictRequestError,
	isServerRequestError,
} from "@/fetch";
import type {
	CanadaLoginEnvironment,
	RPApplicationAdoptionFieldComparisonRead,
	RPApplicationAdoptionFieldValue,
	RPApplicationWorkspaceAdoptionRead,
} from "@/fetch/rp-applications";
import { useWorkspaceApplicationInformationList } from "../hooks/use-workspace-application-information";
import {
	useRPRegistrationAdoptionActions,
	useRPRegistrationAdoptionPreview,
} from "../hooks/use-rp-registration-adoption";
import { useWorkspaces } from "../hooks/use-workspaces";

type ComparisonRow = {
	field: string;
	localValue: string;
	providerValue: string;
	status: string;
};

const formatComparisonValue = (
	value: RPApplicationAdoptionFieldValue,
	trueLabel: string,
	falseLabel: string,
	missingLabel: string
): string => {
	if (value == null || (Array.isArray(value) && value.length === 0)) {
		return missingLabel;
	}
	if (typeof value === "boolean") {
		return value ? trueLabel : falseLabel;
	}
	if (Array.isArray(value)) {
		return value.join(", ");
	}
	return value;
};

export const RPRegistrationAdoptionDetailPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const { rpApplicationUuid } = useParams({
		from: "/workspaces/rp-registration-adoption/$rpApplicationUuid",
	});
	const {
		error: previewError,
		isLoading: isLoadingPreview,
		preview,
		refetch,
	} = useRPRegistrationAdoptionPreview(rpApplicationUuid);
	const {
		error: workspacesError,
		isLoading: isLoadingWorkspaces,
		workspaces,
	} = useWorkspaces();
	const { isLinking, linkToWorkspace } = useRPRegistrationAdoptionActions();
	const [workspaceUuid, setWorkspaceUuid] = useState("");
	const [applicationInformationUuid, setApplicationInformationUuid] =
		useState("");
	const [canadaLoginEnvironment, setCanadaLoginEnvironment] = useState<
		CanadaLoginEnvironment | ""
	>("");
	const [submissionError, setSubmissionError] = useState<Error | null>(null);
	const [validationAttempted, setValidationAttempted] = useState(false);
	const [adopted, setAdopted] =
		useState<RPApplicationWorkspaceAdoptionRead | null>(null);
	const successNoticeRef = useRef<HTMLDivElement>(null);
	const {
		applicationInformationRecords,
		error: applicationInformationError,
		isLoading: isLoadingApplicationInformation,
	} = useWorkspaceApplicationInformationList(workspaceUuid);

	const pageTitle = preview?.candidate.name
		? t("rpRegistrationAdoption.detailTitle", {
				name: preview.candidate.name,
			})
		: t("rpRegistrationAdoption.detailTitleFallback");
	useDocumentTitle(pageTitle, t("home.title"));

	const sortedWorkspaces = useMemo(
		() =>
			[...workspaces].sort((left, right) =>
				left.name.localeCompare(right.name)
			),
		[workspaces]
	);
	const sortedApplicationInformation = useMemo(
		() =>
			[...applicationInformationRecords].sort((left, right) =>
				left.serviceNameEn.localeCompare(right.serviceNameEn)
			),
		[applicationInformationRecords]
	);
	const environmentRequired = preview?.canadaLoginEnvironment == null;
	const hasWorkspaceError = validationAttempted && workspaceUuid.length === 0;
	const hasEnvironmentError =
		validationAttempted &&
		environmentRequired &&
		canadaLoginEnvironment.length === 0;
	const previewErrorNotice = getRequestErrorNotice(previewError, {
		bodyKey: "rpRegistrationAdoption.previewErrorBody",
		titleKey: "rpRegistrationAdoption.previewErrorTitle",
	});
	const workspacesErrorNotice = getRequestErrorNotice(workspacesError, {
		bodyKey: "rpRegistrationAdoption.workspacesErrorBody",
		titleKey: "rpRegistrationAdoption.workspacesErrorTitle",
	});
	const applicationInformationErrorNotice = getRequestErrorNotice(
		applicationInformationError,
		{
			bodyKey: "rpRegistrationAdoption.applicationInformationErrorBody",
			titleKey: "rpRegistrationAdoption.applicationInformationErrorTitle",
		}
	);
	const submissionErrorNotice = getRequestErrorNotice(submissionError, {
		bodyKey: "rpRegistrationAdoption.submitErrorBody",
		titleKey: "rpRegistrationAdoption.submitErrorTitle",
	});
	const providerUnavailable =
		isServerRequestError(previewError) && previewError.status === 503;
	const alreadyLinked =
		isConflictRequestError(submissionError) &&
		submissionError.code === "rp_application_already_linked";
	const comparisonRows: Array<ComparisonRow> =
		preview?.fields.map((field: RPApplicationAdoptionFieldComparisonRead) => ({
			field: t(`rpRegistrationAdoption.fields.${field.fieldName}`),
			localValue: formatComparisonValue(
				field.localValue,
				t("common.yes"),
				t("common.no"),
				t("common.notAvailable")
			),
			providerValue: formatComparisonValue(
				field.providerValue,
				t("common.yes"),
				t("common.no"),
				t("common.notAvailable")
			),
			status: t(`rpRegistrationAdoption.fieldStatus.${field.status}`),
		})) ?? [];
	const comparisonColumns: Array<DataTableColumn<ComparisonRow>> = [
		{
			field: "field",
			headerName: t("rpRegistrationAdoption.fieldColumn"),
		},
		{
			field: "localValue",
			headerName: t("rpRegistrationAdoption.portalValueColumn"),
		},
		{
			field: "providerValue",
			headerName: t("rpRegistrationAdoption.ibmValueColumn"),
		},
		{
			field: "status",
			headerName: t("rpRegistrationAdoption.statusColumn"),
		},
	];

	useEffect(() => {
		if (adopted) {
			successNoticeRef.current?.focus();
		}
	}, [adopted]);

	const handleSubmit = async (): Promise<void> => {
		setValidationAttempted(true);
		setSubmissionError(null);
		if (
			workspaceUuid.length === 0 ||
			(environmentRequired && canadaLoginEnvironment.length === 0)
		) {
			return;
		}

		try {
			const result = await linkToWorkspace(rpApplicationUuid, {
				applicationInformationUuid: applicationInformationUuid || null,
				canadaLoginEnvironment:
					preview?.canadaLoginEnvironment ?? (canadaLoginEnvironment || null),
				workspaceUuid,
			});
			setAdopted(result);
		} catch (requestError) {
			setSubmissionError(requestError as Error);
		}
	};

	return (
		<>
			<Heading tag="h1">{pageTitle}</Heading>
			<Text>{t("rpRegistrationAdoption.detailSummary")}</Text>

			{isLoadingPreview ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("rpRegistrationAdoption.previewLoadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("rpRegistrationAdoption.previewLoadingBody")}</Text>
				</Notice>
			) : null}

			{previewErrorNotice ? (
				<Notice
					noticeRole={previewErrorNotice.noticeRole}
					noticeTitleTag="h2"
					noticeTitle={t(
						providerUnavailable
							? "rpRegistrationAdoption.providerUnavailableTitle"
							: previewErrorNotice.titleKey
					)}
				>
					<Text>
						{providerUnavailable
							? t("rpRegistrationAdoption.providerUnavailableBody")
							: (previewErrorNotice.bodyText ?? t(previewErrorNotice.bodyKey))}
					</Text>
					<Button
						buttonRole="secondary"
						type="button"
						onGcdsClick={() => {
							void refetch();
						}}
					>
						{t("rpRegistrationAdoption.retryAction")}
					</Button>
				</Notice>
			) : null}

			{preview && !adopted ? (
				<div className="grid gap-400">
					<Notice
						noticeRole="info"
						noticeTitle={t("rpRegistrationAdoption.ibmBoundaryTitle")}
						noticeTitleTag="h2"
					>
						<Text>{t("rpRegistrationAdoption.ibmBoundaryBody")}</Text>
					</Notice>

					<Heading tag="h2">
						{t("rpRegistrationAdoption.comparisonTitle")}
					</Heading>
					<Text>
						{t("rpRegistrationAdoption.ibmApplicationId", {
							id: preview.candidate.ibmApplicationId,
						})}
					</Text>
					<DataTable
						columns={comparisonColumns}
						itemLabel={t("rpRegistrationAdoption.comparisonItemLabel")}
						pagination={false}
						rows={comparisonRows}
						title={t("rpRegistrationAdoption.comparisonTitle")}
					/>

					<Heading tag="h2">{t("rpRegistrationAdoption.formTitle")}</Heading>
					<Text>{t("rpRegistrationAdoption.formSummary")}</Text>
					{hasWorkspaceError || hasEnvironmentError ? (
						<ErrorSummary listen />
					) : null}
					{workspacesErrorNotice ? (
						<Notice
							noticeRole={workspacesErrorNotice.noticeRole}
							noticeTitle={t(workspacesErrorNotice.titleKey)}
							noticeTitleTag="h3"
						>
							<Text>
								{workspacesErrorNotice.bodyText ??
									t(workspacesErrorNotice.bodyKey)}
							</Text>
						</Notice>
					) : null}

					<Select
						required
						hint={t("rpRegistrationAdoption.workspaceHint")}
						label={t("rpRegistrationAdoption.workspaceLabel")}
						name="workspace"
						selectId="rp-adoption-workspace"
						validateOn="other"
						value={workspaceUuid}
						errorMessage={
							hasWorkspaceError
								? t("rpRegistrationAdoption.workspaceRequired")
								: undefined
						}
						onInput={(event): void => {
							setWorkspaceUuid((event.target as HTMLSelectElement).value);
							setApplicationInformationUuid("");
						}}
					>
						<option value="">
							{isLoadingWorkspaces
								? t("rpRegistrationAdoption.loadingWorkspacesOption")
								: t("rpRegistrationAdoption.chooseWorkspace")}
						</option>
						{sortedWorkspaces.map((workspace) => (
							<option key={workspace.uuid} value={workspace.uuid}>
								{workspace.name}
							</option>
						))}
					</Select>

					{applicationInformationErrorNotice ? (
						<Notice
							noticeRole={applicationInformationErrorNotice.noticeRole}
							noticeTitle={t(applicationInformationErrorNotice.titleKey)}
							noticeTitleTag="h3"
						>
							<Text>
								{applicationInformationErrorNotice.bodyText ??
									t(applicationInformationErrorNotice.bodyKey)}
							</Text>
						</Notice>
					) : null}
					<Select
						hint={t("rpRegistrationAdoption.applicationInformationHint")}
						label={t("rpRegistrationAdoption.applicationInformationLabel")}
						name="application-information"
						selectId="rp-adoption-application-information"
						value={applicationInformationUuid}
						onInput={(event): void => {
							setApplicationInformationUuid(
								(event.target as HTMLSelectElement).value
							);
						}}
					>
						<option value="">
							{isLoadingApplicationInformation
								? t(
										"rpRegistrationAdoption.loadingApplicationInformationOption"
									)
								: t("rpRegistrationAdoption.noApplicationInformationOption")}
						</option>
						{sortedApplicationInformation.map((applicationInformation) => (
							<option
								key={applicationInformation.uuid}
								value={applicationInformation.uuid}
							>
								{applicationInformation.serviceNameEn}
							</option>
						))}
					</Select>

					{environmentRequired ? (
						<Select
							required
							hint={t("rpRegistrationAdoption.environmentHint")}
							label={t("rpRegistrationAdoption.environmentLabel")}
							name="canada-login-environment"
							selectId="rp-adoption-environment"
							validateOn="other"
							value={canadaLoginEnvironment}
							errorMessage={
								hasEnvironmentError
									? t("rpRegistrationAdoption.environmentRequired")
									: undefined
							}
							onInput={(event): void => {
								setCanadaLoginEnvironment(
									(event.target as HTMLSelectElement).value as
										CanadaLoginEnvironment | ""
								);
							}}
						>
							<option value="">
								{t("rpRegistrationAdoption.chooseEnvironment")}
							</option>
							<option value="test">
								{t("rpRegistrationAdoption.environments.test")}
							</option>
							<option value="staging">
								{t("rpRegistrationAdoption.environments.staging")}
							</option>
							<option value="production">
								{t("rpRegistrationAdoption.environments.production")}
							</option>
						</Select>
					) : (
						<Text>
							{t("rpRegistrationAdoption.existingEnvironment", {
								environment: t(
									`rpRegistrationAdoption.environments.${preview.canadaLoginEnvironment}`
								),
							})}
						</Text>
					)}

					<Notice
						noticeRole="warning"
						noticeTitle={t("rpRegistrationAdoption.confirmationTitle")}
						noticeTitleTag="h3"
					>
						<Text>{t("rpRegistrationAdoption.confirmationBody")}</Text>
					</Notice>

					{submissionErrorNotice ? (
						<Notice
							noticeRole={submissionErrorNotice.noticeRole}
							noticeTitleTag="h3"
							noticeTitle={t(
								alreadyLinked
									? "rpRegistrationAdoption.alreadyLinkedTitle"
									: submissionErrorNotice.titleKey
							)}
						>
							<Text>
								{alreadyLinked
									? t("rpRegistrationAdoption.alreadyLinkedBody")
									: (submissionErrorNotice.bodyText ??
										t(submissionErrorNotice.bodyKey))}
							</Text>
						</Notice>
					) : null}

					<div className="flex flex-wrap gap-200">
						<Button
							disabled={isLinking}
							type="button"
							onGcdsClick={() => {
								void handleSubmit();
							}}
						>
							{isLinking
								? t("rpRegistrationAdoption.linkingAction")
								: t("rpRegistrationAdoption.linkAction")}
						</Button>
						<Button
							buttonRole="secondary"
							href="/workspaces/rp-registration-adoption"
							type="link"
						>
							{t("common.cancel")}
						</Button>
					</div>
				</div>
			) : null}

			{adopted ? (
				<div ref={successNoticeRef} tabIndex={-1}>
					<Notice
						noticeRole="success"
						noticeTitle={t("rpRegistrationAdoption.successTitle")}
						noticeTitleTag="h2"
					>
						<Text>
							{t("rpRegistrationAdoption.successBody", {
								name: adopted.name,
							})}
						</Text>
						<div className="flex flex-wrap gap-300">
							<Link
								href={`/workspaces/${encodeURIComponent(adopted.workspaceUuid)}/applications/${encodeURIComponent(adopted.rpApplicationUuid)}`}
							>
								{t("rpRegistrationAdoption.viewApplicationAction")}
							</Link>
							<Link
								href={`/workspaces/${encodeURIComponent(adopted.workspaceUuid)}`}
							>
								{t("rpRegistrationAdoption.viewWorkspaceAction")}
							</Link>
							<Link href="/workspaces/rp-registration-adoption">
								{t("rpRegistrationAdoption.backToCandidatesAction")}
							</Link>
						</div>
					</Notice>
				</div>
			) : null}
		</>
	);
};
