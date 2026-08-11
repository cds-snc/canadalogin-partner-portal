import { useState } from "react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, ConfirmDialog, Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useApplicationInformationContacts } from "../hooks/use-application-information-contacts";
import { useWorkspaceApplicationInformationList } from "../hooks/use-workspace-application-information";
import { useWorkspaceRPApplicationManagement } from "../hooks/use-workspace-rp-application-management";
import { useWorkspaceRPApplication } from "../hooks/use-workspace-rp-applications";
import {
	getWorkspaceOnboardingStateLabel,
	getWorkspacePromotionStatusLabel,
} from "../onboarding-display";
import { getApplicationInformationReadinessSummary } from "../onboarding-readiness";

const readString = (
	payload: Record<string, unknown> | null | undefined,
	key: string
): string | null => {
	const value = payload?.[key];
	return typeof value === "string" && value.trim().length > 0 ? value : null;
};

const readStringArray = (
	payload: Record<string, unknown> | null | undefined,
	key: string
): Array<string> => {
	const value = payload?.[key];
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(
		(entry): entry is string =>
			typeof entry === "string" && entry.trim().length > 0
	);
};

export const WorkspaceApplicationDetailPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const { rpApplicationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid",
	});
	const search = useSearch({
		from: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid",
	});
	const { application, error, isLoading } = useWorkspaceRPApplication(
		workspaceUuid,
		rpApplicationUuid
	);
	const { deleteRPApplication, isDeleting } =
		useWorkspaceRPApplicationManagement();
	const { applicationInformationRecords } =
		useWorkspaceApplicationInformationList(workspaceUuid);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [localError, setLocalError] = useState<Error | null>(null);
	const linkedApplicationInformation =
		!application?.application_information_id
			? null
			: (applicationInformationRecords.find(
					(applicationInformation) =>
						applicationInformation.id ===
						application.application_information_id
			  ) ?? null);
	const {
		contacts: linkedApplicationInformationContacts,
		error: linkedContactsError,
		isLoading: isLoadingLinkedContacts,
	} = useApplicationInformationContacts(
		workspaceUuid,
		linkedApplicationInformation?.uuid ?? ""
	);
	const linkedReadinessSummary =
		linkedApplicationInformation && !isLoadingLinkedContacts
			? getApplicationInformationReadinessSummary(
					linkedApplicationInformation,
					linkedApplicationInformationContacts
				)
			: null;
	const isProductionBound =
		(application?.canada_login_environment?.trim().toLowerCase() ?? "") ===
			"production" ||
		(application?.promotion_requested_at?.trim().length ?? 0) > 0 ||
		(application?.promotion_status?.trim().length ?? 0) > 0;
	const showLinkedReadinessWarning =
		isProductionBound &&
		(linkedApplicationInformation === null ||
			(linkedReadinessSummary !== null && !linkedReadinessSummary.submitReady));
	const errorNotice = getRequestErrorNotice(localError ?? error ?? linkedContactsError, {
		bodyKey: "workspaces.applicationsErrorBody",
		titleKey: "workspaces.applicationsErrorTitle",
	});
	const registrationPayload =
		(application?.oidc_registration_payload as Record<
			string,
			unknown
		> | null) ?? null;
	const applicationUrlEn = readString(
		registrationPayload,
		"application_environment_url_en"
	);
	const applicationUrlFr = readString(
		registrationPayload,
		"application_environment_url_fr"
	);
	const redirectUris = readStringArray(registrationPayload, "redirect_uris");
	const owners = application?.application_owner?.owners ?? [];
	const successMessage =
		search.created === "1"
			? t("workspaces.applicationsCreatedSuccess")
			: search.updated === "1"
				? t("workspaces.applicationsUpdatedSuccess")
				: null;

	const handleDeleteApplication = async (): Promise<void> => {
		setLocalError(null);

		try {
			await deleteRPApplication(workspaceUuid, rpApplicationUuid);

			await navigate({
				params: { workspaceUuid },
				replace: true,
				search: { deleted: "1" },
				to: "/workspaces/$workspaceUuid/applications",
			});
		} catch (requestError) {
			setDeleteDialogOpen(false);
			setLocalError(requestError as Error);
		}
	};

	return (
		<>
			<Heading tag="h1">
				{application
					? t("workspaces.applicationsDetailTitle", {
							name: application.dnr_app_name,
						})
					: t("workspaces.applicationsSectionTitle")}
			</Heading>
			<Text>{t("workspaces.applicationsDetailSummary")}</Text>

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
				<div className="grid gap-300">
					{showLinkedReadinessWarning ? (
						<Notice
							noticeRole="warning"
							noticeTitle={
								linkedApplicationInformation
									? t(
											"workspaces.applicationsProductionReadinessWarningTitle"
									  )
									: t(
											"workspaces.applicationsProductionLinkInfoWarningTitle"
									  )
							}
							noticeTitleTag="h2"
						>
							<Text>
								{linkedApplicationInformation
									? t(
											"workspaces.applicationsProductionReadinessWarningBody"
									  )
									: t(
											"workspaces.applicationsProductionLinkInfoWarningBody"
									  )}
							</Text>
						</Notice>
					) : null}

					{isProductionBound ? (
						<Notice
							noticeRole="info"
							noticeTitle={t(
								"workspaces.applicationsProductionReadinessInfoTitle"
							)}
							noticeTitleTag="h2"
						>
							<Text>
								{t(
									"workspaces.applicationsProductionReadinessInfoBody"
								)}
							</Text>
						</Notice>
					) : null}

					<Heading tag="h2">{t("workspaces.applicationsSectionTitle")}</Heading>
					<Text>{`${t("workspaces.applicationsEnvironmentLabel")}: ${application.canada_login_environment ?? t("common.notAvailable")}`}</Text>
					<Text>{`${t("workspaces.applicationsStatusLabel")}: ${application.status ?? t("common.notAvailable")}`}</Text>
					<Text>
						{`${t("workspaces.onboardingStateLabel")}: ${application.onboarding_state?.trim() ? getWorkspaceOnboardingStateLabel(t, application.onboarding_state) : t("common.notAvailable")}`}
					</Text>
					<Text>
						{`${t("workspaces.productionReviewLabel")}: ${application.promotion_status?.trim() ? getWorkspacePromotionStatusLabel(t, application.promotion_status) : t("common.notAvailable")}`}
					</Text>
					<Text>{`${t("workspaces.applicationsIbmIdLabel")}: ${application.ibm_sv_application_id ?? t("common.notAvailable")}`}</Text>
					<Text>
						{`${t("workspaces.applicationsLinkedInfoLabel")}: ${linkedApplicationInformation?.serviceNameEn ?? t("workspaces.applicationsNoLinkedInfo")}`}
					</Text>
					<Text>
						{`${t("workspaces.applicationsOwnersLabel")}: ${owners.length > 0 ? owners.map((owner) => owner.email).join(", ") : t("common.notAvailable")}`}
					</Text>
					<Text>{`${t("workspaces.submittedAtLabel")}: ${application.submitted_at ?? t("common.notAvailable")}`}</Text>
					<Text>{`${t("workspaces.underReviewAtLabel")}: ${application.under_review_at ?? t("common.notAvailable")}`}</Text>
					<Text>{`${t("workspaces.approvedAtLabel")}: ${application.approved_at ?? t("common.notAvailable")}`}</Text>
					<Text>{`${t("workspaces.launchedAtLabel")}: ${application.launched_at ?? t("common.notAvailable")}`}</Text>
					<Text>{`${t("workspaces.applicationsCreatedAtLabel")}: ${application.created_at}`}</Text>

					{applicationUrlEn ? (
						<Text>{`${t("workspaces.applicationsUrlEnLabel")}: ${applicationUrlEn}`}</Text>
					) : null}
					{applicationUrlFr ? (
						<Text>{`${t("workspaces.applicationsUrlFrLabel")}: ${applicationUrlFr}`}</Text>
					) : null}
					<div>
						<Heading tag="h2">
							{t("workspaces.applicationsRedirectUrisLabel")}
						</Heading>
						{redirectUris.length > 0 ? (
							<ul className="list-disc pl-300">
								{redirectUris.map((redirectUri) => (
									<li key={redirectUri}>{redirectUri}</li>
								))}
							</ul>
						) : (
							<Text>{t("workspaces.applicationsNoRedirectUris")}</Text>
						)}
					</div>

					<div className="flex flex-wrap gap-200">
						<Button
							buttonRole="secondary"
							href={`/workspaces/${workspaceUuid}/applications/${rpApplicationUuid}/edit`}
							type="link"
						>
							{t("workspaces.applicationsEditAction")}
						</Button>
						<Button
							buttonRole="secondary"
							href={`/workspaces/${workspaceUuid}/applications/${rpApplicationUuid}/usage`}
							type="link"
						>
							{t("workspaces.applicationsUsageAction")}
						</Button>
						<Button
							buttonRole="secondary"
							href={`/workspaces/${workspaceUuid}/applications/${rpApplicationUuid}/audit`}
							type="link"
						>
							{t("workspaces.applicationsAuditAction")}
						</Button>
						{linkedApplicationInformation ? (
							<Button
								buttonRole="secondary"
								href={`/workspaces/${workspaceUuid}/application-information/${linkedApplicationInformation.uuid}`}
								type="link"
							>
								{t("workspaces.manageApplicationInformation")}
							</Button>
						) : null}
						<Button
							buttonRole="danger"
							type="button"
							onGcdsClick={() => {
								setDeleteDialogOpen(true);
							}}
						>
							{t("workspaces.deleteApplication")}
						</Button>
						<Button
							href={`/workspaces/${workspaceUuid}/applications`}
							type="link"
						>
							{t("workspaces.applicationsBackToList")}
						</Button>
					</div>
				</div>
			) : null}

			<ConfirmDialog
				cancelLabel={t("common.cancel")}
				isOpen={deleteDialogOpen}
				title={t("workspaces.deleteApplicationConfirmTitle")}
				confirmLabel={
					isDeleting
						? t("workspaces.deletingAction")
						: t("workspaces.deleteApplication")
				}
				description={t("workspaces.deleteApplicationConfirmBody", {
					name: application?.dnr_app_name ?? "",
				})}
				onCancel={() => {
					setDeleteDialogOpen(false);
				}}
				onConfirm={() => {
					void handleDeleteApplication();
				}}
			/>
		</>
	);
};
