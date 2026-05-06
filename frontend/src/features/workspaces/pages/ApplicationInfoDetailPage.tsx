import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "@tanstack/react-router";
import { getLocalizedDepartmentName } from "@/common/get-localized-department-name";
import type { FunctionComponent } from "@/common/types";
import { Breadcrumbs, CenteredPageLayout } from "@/components/layout";
import { Button, ConfirmDialog, Heading, Notice, Text } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { ApplicationInfoModal } from "@/features/workspaces/components/ApplicationInfoModal";
import { useSession } from "@/features/auth/hooks/use-session";
import {
	translateApplicationInfoEnumValue,
	translateApplicationInfoEnumValues,
} from "@/features/workspaces/application-info-options";
import { getRequestErrorMessage, getRequestErrorNotice } from "@/fetch";
import { getDepartmentById } from "@/fetch/departments";
import {
	deleteWorkspaceApplicationInfo,
	getWorkspaceApplicationInfos,
	workspaceApplicationInfoQueryKey,
} from "@/fetch/application-info";
import { getWorkspaceMembers, getWorkspaces } from "@/fetch/workspaces";

const detailCardClasses =
	"rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] px-400 py-350 shadow-[0_14px_28px_rgba(38,55,74,0.06)]";
const detailGridClasses = "grid gap-150 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)] md:items-start";

const getDisplayValue = (value: string | null | undefined): string => {
	if (!value || value.trim().length === 0) {
		return "-";
	}

	return value;
};

const getBooleanDisplayValue = (
	value: boolean,
	t: (key: string) => string
): string => t(value ? "workspaces.optionYes" : "workspaces.optionNo");

export const ApplicationInfoDetailPage = (): FunctionComponent => {
	const { t, i18n } = useTranslation() as unknown as {
		t: (key: string, options?: Record<string, unknown>) => string;
		i18n: {
			language: string;
		};
	};
	const { applicationInfoUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/application-info/$applicationInfoUuid",
	});
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const toast = useToast();
	const { currentUser } = useSession();
	const [isApplicationInfoModalOpen, setIsApplicationInfoModalOpen] =
		useState(false);
	const [isDeleteApplicationInfoDialogOpen, setIsDeleteApplicationInfoDialogOpen] =
		useState(false);
	const [isDeletingApplicationInfo, setIsDeletingApplicationInfo] =
		useState(false);

	const {
		data: workspace,
		error: workspaceQueryError,
		isError: isWorkspaceError,
		isLoading: isWorkspaceLoading,
	} = useQuery({
		queryKey: ["workspace", workspaceUuid],
		queryFn: () =>
			getWorkspaces().then((workspaces) =>
				workspaces.find((workspaceItem) => workspaceItem.uuid === workspaceUuid)
			),
		enabled: !!workspaceUuid,
	});

	const {
		data: applicationInfos,
		error: applicationInfoQueryError,
		isError: isApplicationInfoError,
		isLoading: isApplicationInfoLoading,
		refetch: refetchApplicationInfos,
	} = useQuery({
		queryKey: workspaceApplicationInfoQueryKey(workspaceUuid),
		queryFn: () => getWorkspaceApplicationInfos(workspaceUuid),
		enabled: !!workspaceUuid,
	});

	const { data: workspaceMembers } = useQuery({
		queryKey: ["workspace-members", workspaceUuid],
		queryFn: () => getWorkspaceMembers(workspaceUuid),
		enabled: !!workspaceUuid && !!currentUser?.uuid,
	});

	const { data: department } = useQuery({
		queryKey: ["department", workspace?.departmentId],
		queryFn: () => getDepartmentById(workspace!.departmentId),
		enabled: typeof workspace?.departmentId === "number",
	});

	const applicationInfo =
		applicationInfos?.find((item) => item.uuid === applicationInfoUuid) ?? null;
	const departmentName = getLocalizedDepartmentName(department, i18n.language);
	const isWorkspaceAdmin =
		!!currentUser?.uuid &&
		(workspaceMembers ?? []).some(
			(member) =>
				member.userUuid === currentUser.uuid &&
				member.role === "workspace_admin"
		);

	const workspaceErrorNotice = getRequestErrorNotice(
		workspaceQueryError as Error | null | undefined,
		{
			bodyKey: "workspaces.errorLoading",
			titleKey: "workspaces.errorLoading",
		}
	);
	const applicationInfoErrorNotice = getRequestErrorNotice(
		applicationInfoQueryError as Error | null | undefined,
		{
			bodyKey: "workspaces.errorLoadingApplicationInfo",
			titleKey: "workspaces.errorLoadingApplicationInfo",
		}
	);

	if (isWorkspaceLoading || isApplicationInfoLoading) {
		return (
			<CenteredPageLayout className="max-w-5xl">
				<Text>{t("workspaces.loadingApplicationInfo")}</Text>
			</CenteredPageLayout>
		);
	}

	if (isWorkspaceError || !workspace) {
		return (
			<CenteredPageLayout className="max-w-5xl">
				<Notice
					noticeRole={workspaceErrorNotice?.noticeRole ?? "danger"}
					noticeTitleTag="h2"
					noticeTitle={t(
						(workspaceErrorNotice?.titleKey ??
							"workspaces.errorLoading") as never
					)}
				>
					<Text>
						{workspaceErrorNotice?.bodyText ??
							t(
								(workspaceErrorNotice?.bodyKey ??
									"workspaces.errorLoading") as never
							)}
					</Text>
				</Notice>
			</CenteredPageLayout>
		);
	}

	if (isApplicationInfoError || !applicationInfo) {
		return (
			<CenteredPageLayout className="max-w-5xl">
				<Notice
					noticeRole={applicationInfoErrorNotice?.noticeRole ?? "danger"}
					noticeTitleTag="h2"
					noticeTitle={t(
						(applicationInfoErrorNotice?.titleKey ??
							"workspaces.errorLoadingApplicationInfo") as never
					)}
				>
					<Text>
						{applicationInfoErrorNotice?.bodyText ??
							t(
								(applicationInfoErrorNotice?.bodyKey ??
									"workspaces.errorLoadingApplicationInfo") as never
							)}
					</Text>
				</Notice>
			</CenteredPageLayout>
		);
	}

	type DetailItem = { label: string; value: string | null | undefined };
	type DetailSection = { items: Array<DetailItem>; title: string };

	const detailSections: Array<DetailSection> = [
		{
			title: t("workspaces.appInfoStepAbout"),
			items: [
				{ label: t("workspaces.workspaceName"), value: workspace.name },
				{ label: t("workspaces.department"), value: departmentName },
				{ label: t("workspaces.appInfoApplicationNameLabel"), value: applicationInfo.applicationName },
				{ label: t("workspaces.appInfoAboutLabel"), value: applicationInfo.aboutApplication },
				{ label: t("workspaces.appInfoApplicationDescriptionLabel"), value: applicationInfo.applicationDescription },
				{ label: t("workspaces.appInfoProgramLineOfBusinessLabel"), value: applicationInfo.programLineOfBusiness },
				{ label: t("workspaces.appInfoApplicationUrlLabel"), value: applicationInfo.applicationUrl },
				{ label: t("workspaces.appInfoPortalNameLabel"), value: applicationInfo.portalName },
			],
		},
		{
			title: t("workspaces.appInfoStepTechnology"),
			items: [
				{ label: t("workspaces.appInfoTechnologyLabel"), value: applicationInfo.technology },
				{ label: t("workspaces.appInfoAuthenticationProtocolLabel"), value: translateApplicationInfoEnumValue(applicationInfo.authenticationProtocol, t) },
				{ label: t("workspaces.appInfoPlannedOidcDateLabel"), value: applicationInfo.plannedOidcImplementationDate },
				{ label: t("workspaces.appInfoTechStackLabel"), value: applicationInfo.techStack },
			],
		},
		{
			title: t("workspaces.appInfoStepSecurity"),
			items: [
				{ label: t("workspaces.appInfoRequestsProfileDataPushesLabel"), value: getBooleanDisplayValue(applicationInfo.requestsProfileDataPushes, t) },
				{ label: t("workspaces.appInfoHasAccessManagementLayerLabel"), value: getBooleanDisplayValue(applicationInfo.hasAccessManagementLayer, t) },
				{ label: t("workspaces.appInfoRollbackStrategyLabel"), value: applicationInfo.rollbackStrategy },
				{ label: t("workspaces.appInfoCalLabel"), value: applicationInfo.credentialAssuranceLevel },
				{ label: t("workspaces.appInfoIalLabel"), value: applicationInfo.identityAssuranceLevel },
				{ label: t("workspaces.appInfoIdentityProofingLabel"), value: translateApplicationInfoEnumValue(applicationInfo.identityProofingMethod, t) },
				{ label: t("workspaces.appInfoOtherLabel"), value: applicationInfo.identityProofingMethodOther },
				{ label: t("workspaces.appInfoIsCbasLabel"), value: getBooleanDisplayValue(applicationInfo.isCbas, t) },
				{ label: t("workspaces.appInfoHasAccountRecoveryLabel"), value: getBooleanDisplayValue(applicationInfo.hasAccountRecovery, t) },
				{ label: t("workspaces.appInfoAuthorityLabel"), value: applicationInfo.authorityToCollectPersonalInformation },
				{ label: t("workspaces.appInfoHasPrivacyNoticeLabel"), value: getBooleanDisplayValue(applicationInfo.hasPrivacyNotice, t) },
			],
		},
		{
			title: t("workspaces.appInfoStepUsage"),
			items: [
				{ label: t("workspaces.appInfoMonthlyActiveUsersLabel"), value: applicationInfo.monthlyActiveUsers ? String(applicationInfo.monthlyActiveUsers) : "-" },
				{ label: t("workspaces.appInfoPeakUsagePeriodsLabel"), value: applicationInfo.peakUsagePeriods },
				{ label: t("workspaces.appInfoPersonalInformationCollectedLabel"), value: translateApplicationInfoEnumValues(applicationInfo.personalInformationCollected, t) },
				{ label: t("workspaces.appInfoPersonalInformationOtherLabel"), value: applicationInfo.personalInformationOther },
				{ label: t("workspaces.appInfoConsolidatorUsedLabel"), value: translateApplicationInfoEnumValue(applicationInfo.consolidatorUsed, t) },
				{ label: t("workspaces.appInfoCurrentSignInOptionsLabel"), value: translateApplicationInfoEnumValues(applicationInfo.currentSignInOptions, t) },
				{ label: t("workspaces.appInfoCurrentSignInOptionsOtherLabel"), value: applicationInfo.currentSignInOptionsOther },
				{ label: t("workspaces.appInfoCurrentMfaOptionsLabel"), value: translateApplicationInfoEnumValue(applicationInfo.currentMfaOptions, t) },
				{ label: t("workspaces.appInfoUserTypeLabel"), value: translateApplicationInfoEnumValues(applicationInfo.userTypes, t) },
				{ label: t("workspaces.appInfoUserTypeOtherLabel"), value: applicationInfo.userTypeOther },
			],
		},
		{
			title: t("workspaces.appInfoStepTransition"),
			items: [
				{ label: t("workspaces.appInfoUsesCanadaloginMigrationLabel"), value: getBooleanDisplayValue(applicationInfo.usesCanadaloginMigration, t) },
				{ label: t("workspaces.appInfoTransitionRationaleLabel"), value: applicationInfo.migrationRationale },
				{ label: t("workspaces.appInfoScheduleBlackoutPeriodsLabel"), value: applicationInfo.scheduleBlackoutPeriods },
				{ label: t("workspaces.appInfoTransitionRisksLabel"), value: applicationInfo.transitionRisks },
				{ label: t("workspaces.appInfoTransitionMitigationsLabel"), value: applicationInfo.transitionMitigations },
			],
		},
	];

	const handleDeleteApplicationInfo = async (): Promise<void> => {
		setIsDeletingApplicationInfo(true);
		try {
			await deleteWorkspaceApplicationInfo(workspaceUuid, applicationInfoUuid);
			await queryClient.invalidateQueries({
				queryKey: workspaceApplicationInfoQueryKey(workspaceUuid),
			});
			toast.success(t("workspaces.appInfoDeletedSuccess"));
			setIsDeleteApplicationInfoDialogOpen(false);
			void navigate({
				params: { workspaceUuid },
				to: "/workspaces/$workspaceUuid",
			});
		} catch (error) {
			toast.error(getRequestErrorMessage(error, t("errors.unknown")));
		} finally {
			setIsDeletingApplicationInfo(false);
		}
	};

	return (
		<CenteredPageLayout className="max-w-5xl gap-400">
			<Breadcrumbs
				items={[
					{ href: "/", label: t("nav.home") },
					{ href: "/workspaces", label: t("workspaces.title") },
					{ href: `/workspaces/${workspaceUuid}`, label: workspace.name },
					{
						href: `/workspaces/${workspaceUuid}/application-info/${applicationInfoUuid}`,
						label: applicationInfo.applicationName,
					},
				]}
			/>
			<div className="flex flex-col gap-300">
				<div className="flex items-start justify-between gap-200">
					<div>
						<Heading tag="h1">
							{t("workspaces.appInfoDetailTitle", {
								name: applicationInfo.applicationName,
							})}
						</Heading>
						<Text>{t("workspaces.appInfoSectionTitle")}</Text>
					</div>
					<div className="flex flex-wrap justify-end gap-150">
						<Button
							buttonRole="secondary"
							type="button"
							onGcdsClick={(): void =>
								void navigate({
									params: { workspaceUuid },
									to: "/workspaces/$workspaceUuid",
								})
							}
						>
							{t("workspaces.backToWorkspace")}
						</Button>
						<Button
							type="button"
							onGcdsClick={(): void =>
								void navigate({
									params: { applicationInfoUuid, workspaceUuid },
									to: "/workspaces/$workspaceUuid/application-info/$applicationInfoUuid/contacts",
								})
							}
						>
							{t("workspaces.appInfoManageContacts")}
						</Button>
					</div>
				</div>

				<section className={detailCardClasses}>
					<div className="flex flex-col gap-250">
						{detailSections.map((section) => (
							<div key={section.title} className="flex flex-col gap-150">
								<Heading tag="h2">{section.title}</Heading>
								<div className={detailGridClasses}>
									{section.items.map((item) => (
										<div key={`${section.title}-${item.label}`} className="contents">
											<Text>{item.label}</Text>
											<Text>{getDisplayValue(item.value)}</Text>
										</div>
									))}
								</div>
							</div>
						))}
						{isWorkspaceAdmin ? (
							<div className="flex justify-end gap-150 pt-100">
								<Button
									type="button"
									onGcdsClick={(): void => { setIsApplicationInfoModalOpen(true); }}
								>
									{t("workspaces.appInfoEdit")}
								</Button>
								<Button
									buttonRole="danger"
									type="button"
									onGcdsClick={(): void =>
										{ setIsDeleteApplicationInfoDialogOpen(true); }
									}
								>
									{t("workspaces.appInfoDelete")}
								</Button>
							</div>
						) : null}
					</div>
				</section>

				<ApplicationInfoModal
					applicationInfo={applicationInfo}
					isOpen={isApplicationInfoModalOpen}
					mode="edit"
					workspaceUuid={workspaceUuid}
					organizationLabel={getLocalizedDepartmentName(
						department,
						i18n.language,
						undefined
					)}
					onClose={(): void => { setIsApplicationInfoModalOpen(false); }}
					onSaved={async (): Promise<void> => {
						await refetchApplicationInfos();
					}}
				/>

				<ConfirmDialog
					cancelLabel={t("common.cancel")}
					confirmLabel={t("workspaces.delete")}
					isOpen={isDeleteApplicationInfoDialogOpen}
					isPending={isDeletingApplicationInfo}
					title={t("workspaces.appInfoDeleteConfirmTitle")}
					description={t("workspaces.appInfoDeleteConfirmBody", {
						name: applicationInfo.applicationName,
					})}
					onClose={(): void => { setIsDeleteApplicationInfoDialogOpen(false); }}
					onConfirm={(): void => {
						void handleDeleteApplicationInfo();
					}}
				/>

			</div>
		</CenteredPageLayout>
	);
};