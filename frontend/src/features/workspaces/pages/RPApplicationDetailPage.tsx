import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { getLocalizedDepartmentName } from "@/common/get-localized-department-name";
import type { FunctionComponent } from "@/common/types";
import { Breadcrumbs, CenteredPageLayout } from "@/components/layout";
import { Button, ConfirmDialog, Heading, Notice, Text } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { WorkspaceApplicationModal } from "@/features/workspaces/components/WorkspaceApplicationModal";
import { WorkspaceClientCredentialsModal } from "@/features/workspaces/components/WorkspaceClientCredentialsModal";
import {
	getRedirectUrisValue,
	getSettingBoolean,
	getSettingClientType,
	getSettingString,
} from "@/features/workspaces/components/workspace-detail-utils";
import { useSession } from "@/features/auth/hooks/use-session";
import { getRequestErrorMessage, getRequestErrorNotice } from "@/fetch";
import { getDepartmentById } from "@/fetch/departments";
import {
	deleteRPApplication,
	getCurrentUserWorkspaces,
	getRPApplications,
	getWorkspaceMembers,
} from "@/fetch/workspaces";

const detailCardClasses =
	"rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] px-400 py-350 shadow-[0_14px_28px_rgba(38,55,74,0.06)]";

type DetailRowProps = {
	label: string;
	value: string;
};

const DetailRow = ({ label, value }: DetailRowProps): FunctionComponent => (
	<div className="flex flex-col gap-50 border-t border-[var(--gcds-border-default)] py-150 first:border-t-0 first:pt-0 last:pb-0 md:flex-row md:items-start md:justify-between md:gap-300">
		<Text>{label}</Text>
		<Text>{value}</Text>
	</div>
);

export const RPApplicationDetailPage = (): FunctionComponent => {
	const { t, i18n } = useTranslation() as unknown as {
		t: (key: string | Array<string>, opts?: Record<string, unknown>) => string;
		i18n: {
			language: string;
		};
	};
	const dateInputLang = i18n.language.startsWith("fr") ? "fr" : "en";
	const { workspaceUuid, rpApplicationUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid",
	});
	const navigate = useNavigate();
	const toast = useToast();
	const { currentUser } = useSession();

	const [isClientModalOpen, setIsClientModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const {
		data: workspace,
		error: workspaceQueryError,
		isError: isWorkspaceError,
		isLoading: isWorkspaceLoading,
	} = useQuery({
		queryKey: ["workspace", workspaceUuid],
		queryFn: () =>
			getCurrentUserWorkspaces().then((workspaces) =>
				workspaces.find((workspaceItem) => workspaceItem.uuid === workspaceUuid)
			),
		enabled: !!workspaceUuid,
	});

	const {
		data: applications,
		error: applicationsQueryError,
		isError: isApplicationsError,
		isLoading: isApplicationsLoading,
		refetch: refetchApplications,
	} = useQuery({
		queryKey: ["workspace-applications", workspaceUuid],
		queryFn: () => getRPApplications(workspaceUuid),
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

	const application =
		applications?.find((item) => item.uuid === rpApplicationUuid) ?? null;
	const isWorkspaceAdmin =
		!!currentUser?.uuid &&
		(workspaceMembers ?? []).some(
			(member) =>
				member.userUuid === currentUser.uuid &&
				member.role === "workspace_admin"
		);

	const handleManageDeveloperInvitations = (): void => {
		void navigate({
			params: { rpApplicationUuid, workspaceUuid },
			to: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid/developers",
		});
	};

	const workspaceErrorNotice = getRequestErrorNotice(
		workspaceQueryError as Error | null | undefined,
		{
			bodyKey: "workspaces.errorLoading",
			titleKey: "workspaces.errorLoading",
		}
	);
	const applicationsErrorNotice = getRequestErrorNotice(
		applicationsQueryError as Error | null | undefined,
		{
			bodyKey: "workspaces.errorLoadingApplications",
			titleKey: "workspaces.errorLoadingApplications",
		}
	);
	const handleBackToWorkspace = (): void => {
		void navigate({
			params: { workspaceUuid },
			to: "/workspaces/$workspaceUuid",
		});
	};

	const handleViewUsage = (): void => {
		void navigate({
			params: { rpApplicationUuid, workspaceUuid },
			to: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage",
		});
	};

	const handleDeleteApplication = async (): Promise<void> => {
		if (!application) {
			return;
		}

		setIsDeleting(true);
		try {
			await deleteRPApplication(workspaceUuid, application.uuid);
			toast.success(t("workspaces.applicationDeletedSuccess"));
			setIsDeleteDialogOpen(false);
			void navigate({
				params: { workspaceUuid },
				to: "/workspaces/$workspaceUuid",
			});
		} catch (error) {
			console.error(error);
			toast.error(getRequestErrorMessage(error, t("errors.unknown")));
		} finally {
			setIsDeleting(false);
		}
	};

	if (isWorkspaceLoading || isApplicationsLoading) {
		return (
			<CenteredPageLayout className="max-w-5xl">
				<Text>{t("workspaces.loadingApplications")}</Text>
			</CenteredPageLayout>
		);
	}

	const currentWorkspace = workspace!;
	const currentApplication = application!;
	const departmentName =
		getLocalizedDepartmentName(department, i18n.language) ?? "-";
	const applicationUrl = getSettingString(
		currentApplication.settings,
		"application_url"
	);
	const companyName = getSettingString(
		currentApplication.settings,
		"company_name"
	);
	const description = getSettingString(
		currentApplication.settings,
		"description"
	);
	const clientType = getSettingClientType(currentApplication.settings);
	const pkceEnabled = getSettingBoolean(
		currentApplication.settings,
		"pkce_enabled"
	);
	const redirectUris = getRedirectUrisValue(currentApplication.settings)
		.split(/\r?\n/)
		.filter((entry) => entry.trim().length > 0);
	const overviewItems: Array<{ label: string; value: string }> = [
		{
			label: t("workspaces.workspaceName"),
			value: currentWorkspace.name,
		},
		{
			label: t("workspaces.department"),
			value: departmentName,
		},
		{
			label: t("workspaces.applicationStatus"),
			value: currentApplication.status,
		},
	];
	const applicationItems: Array<{ label: string; value: string }> = [
		{
			label: t("workspaces.applicationNameLabel"),
			value: currentApplication.name,
		},
		{
			label: t("workspaces.applicationId"),
			value: currentApplication.ibm_sv_application_id ?? "-",
		},
		{
			label: t("workspaces.applicationUrlLabel"),
			value: applicationUrl || "-",
		},
		{
			label: t("workspaces.applicationCompanyNameLabel"),
			value: companyName || "-",
		},
		{
			label: t("workspaces.applicationDescriptionLabel"),
			value: description || "-",
		},
	];
	const clientItems: Array<{ label: string; value: string }> = [
		{
			label: t("workspaces.applicationClientTypeLabel"),
			value:
				clientType === "public"
					? t("workspaces.applicationClientTypePublicOption")
					: t("workspaces.applicationClientTypeConfidentialOption"),
		},
		{
			label: t("workspaces.applicationPkceLabel"),
			value: pkceEnabled
				? t("workspaces.applicationPkceEnabledOption")
				: t("workspaces.applicationPkceDisabledOption"),
		},
	];

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

	if (isApplicationsError || !application) {
		return (
			<CenteredPageLayout className="max-w-5xl">
				<Notice
					noticeRole={applicationsErrorNotice?.noticeRole ?? "danger"}
					noticeTitleTag="h2"
					noticeTitle={t(
						(applicationsErrorNotice?.titleKey ??
							"workspaces.errorLoadingApplications") as never
					)}
				>
					<Text>
						{applicationsErrorNotice?.bodyText ??
							t(
								(applicationsErrorNotice?.bodyKey ??
									"workspaces.errorLoadingApplications") as never
							)}
					</Text>
				</Notice>
			</CenteredPageLayout>
		);
	}

	return (
		<CenteredPageLayout className="max-w-5xl gap-400">
			<Breadcrumbs
				items={[
					{ href: "/", label: t("nav.home") },
					{ href: "/workspaces", label: t("workspaces.title") },
					{ href: `/workspaces/${workspaceUuid}`, label: workspace.name },
					{
						href: `/workspaces/${workspaceUuid}/applications/${rpApplicationUuid}`,
						label: application.name,
					},
				]}
			/>

			<div className="flex flex-col gap-300">
				<div className="flex items-start justify-between gap-200">
					<div>
						<Heading tag="h1">
							{t("workspaces.applicationManagementTitle", {
								name: application.name,
							})}
						</Heading>
						<Text>{t("workspaces.applicationSummary")}</Text>
					</div>
					<div className="flex flex-col items-stretch gap-150 md:items-end">
						<Button
							buttonRole="secondary"
							type="button"
							onGcdsClick={handleBackToWorkspace}
						>
							{t("workspaces.backToWorkspace")}
						</Button>
						<Button
							buttonRole="primary"
							type="button"
							onGcdsClick={handleViewUsage}
						>
							{t("workspaces.applicationUsageAction")}
						</Button>
					</div>
				</div>

				<section className="flex flex-col gap-300">
					<div className={detailCardClasses}>
						{overviewItems.map((item) => (
							<DetailRow
								key={item.label}
								label={item.label}
								value={item.value}
							/>
						))}
					</div>

					<div className={detailCardClasses}>
						{applicationItems.map((item) => (
							<DetailRow
								key={item.label}
								label={item.label}
								value={item.value}
							/>
						))}
					</div>

					<div className={detailCardClasses}>
						<div className="flex flex-col gap-150">
							{clientItems.map((item) => (
								<DetailRow
									key={item.label}
									label={item.label}
									value={item.value}
								/>
							))}
							<div className="flex justify-end pt-100">
								<Button
									type="button"
									onGcdsClick={() => {
										setIsClientModalOpen(true);
									}}
								>
									{t("workspaces.clientCredentials")}
								</Button>
							</div>
						</div>
					</div>

					<div className={detailCardClasses}>
						<Text>{t("workspaces.applicationRedirectUrisLabel")}</Text>
						{redirectUris.length > 0 ? (
							<ul className="mt-150 flex flex-col gap-100">
								{redirectUris.map((redirectUri) => (
									<li key={redirectUri}>
										<Text>{redirectUri}</Text>
									</li>
								))}
							</ul>
						) : (
							<Text>-</Text>
						)}
					</div>

					<div className="flex flex-wrap justify-end gap-150 border-t border-[var(--gcds-border-default)] pt-250">
						{isWorkspaceAdmin ? (
							<>
								<Button
									buttonRole="secondary"
									type="button"
									onGcdsClick={handleManageDeveloperInvitations}
								>
									{t("workspaces.manageDeveloperInvitations")}
								</Button>
								<Button
									buttonRole="secondary"
									type="button"
									onGcdsClick={() => {
										setIsEditModalOpen(true);
									}}
								>
									{t("workspaces.editApplication")}
								</Button>
								<Button
									buttonRole="danger"
									type="button"
									onGcdsClick={() => {
										setIsDeleteDialogOpen(true);
									}}
								>
									{t("workspaces.deleteApplication")}
								</Button>
							</>
						) : null}
					</div>
				</section>

				<WorkspaceApplicationModal
					application={application}
					isOpen={isEditModalOpen}
					mode="edit"
					workspaceUuid={workspaceUuid}
					onClose={() => {
						setIsEditModalOpen(false);
					}}
					onSaved={async () => {
						await refetchApplications();
					}}
				/>

				<WorkspaceClientCredentialsModal
					application={application}
					dateInputLang={dateInputLang}
					isOpen={isClientModalOpen}
					workspaceUuid={workspaceUuid}
					onClose={() => {
						setIsClientModalOpen(false);
					}}
				/>

				<ConfirmDialog
					cancelLabel={t("common.cancel")}
					isOpen={isDeleteDialogOpen}
					isPending={isDeleting}
					title={t("workspaces.deleteApplicationConfirmTitle")}
					confirmLabel={
						isDeleting
							? t("workspaces.delete")
							: t("workspaces.deleteApplication")
					}
					description={t("workspaces.deleteApplicationConfirmBody", {
						name: application.name,
					})}
					onClose={() => {
						setIsDeleteDialogOpen(false);
					}}
					onConfirm={() => {
						void handleDeleteApplication();
					}}
				/>
			</div>
		</CenteredPageLayout>
	);
};
