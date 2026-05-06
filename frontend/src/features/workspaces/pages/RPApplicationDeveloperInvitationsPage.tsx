import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { getLocalizedDepartmentName } from "@/common/get-localized-department-name";
import type { FunctionComponent } from "@/common/types";
import { Breadcrumbs, CenteredPageLayout } from "@/components/layout";
import { Button, ConfirmDialog, DataTable, Heading, Input, Modal, Notice, Text } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/features/auth/hooks/use-session";
import { getRequestErrorMessage, getRequestErrorNotice } from "@/fetch";
import { getDepartmentById } from "@/fetch/departments";
import {
	getCurrentUserWorkspaces,
	getRPApplicationDeveloperInvitations,
	getRPApplications,
	getWorkspaceMembers,
	inviteRPApplicationDeveloper,
	resendRPApplicationDeveloperInvitation,
	revokeRPApplicationDeveloperInvitation,
	type RPApplicationDeveloperInvitationManagementRead,
} from "@/fetch/workspaces";

const detailCardClasses =
	"rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] px-400 py-350 shadow-[0_14px_28px_rgba(38,55,74,0.06)]";

const formatDateTime = (value: string | null | undefined, language: string): string => {
	if (!value) {
		return "-";
	}

	return new Intl.DateTimeFormat(language.startsWith("fr") ? "fr-CA" : "en-CA", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
};

const getStatusLabel = (
	status: RPApplicationDeveloperInvitationManagementRead["status"],
	t: (key: string, options?: Record<string, unknown>) => string
): string => {
	const translationKeyByStatus: Record<
		RPApplicationDeveloperInvitationManagementRead["status"],
		string
	> = {
		accepted: "workspaces.developerInvitationStatusAccepted",
		expired: "workspaces.developerInvitationStatusExpired",
		pending: "workspaces.developerInvitationStatusPending",
		revoked: "workspaces.developerInvitationStatusRevoked",
	};

	return t(translationKeyByStatus[status]);
};

export const RPApplicationDeveloperInvitationsPage = (): FunctionComponent => {
	const { t, i18n } = useTranslation() as unknown as {
		t: (key: string, options?: Record<string, unknown>) => string;
		i18n: { language: string };
	};
	const { rpApplicationUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid/developers",
	});
	const navigate = useNavigate();
	const toast = useToast();
	const { currentUser } = useSession();
	const [inviteDeveloperEmail, setInviteDeveloperEmail] = useState("");
	const [invitationToRevoke, setInvitationToRevoke] =
		useState<RPApplicationDeveloperInvitationManagementRead | null>(null);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
	const [isRevokingInvitation, setIsRevokingInvitation] = useState(false);

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

	const {
		data: invitations,
		error: invitationsQueryError,
		isError: isInvitationsError,
		isLoading: isInvitationsLoading,
		refetch: refetchInvitations,
	} = useQuery({
		queryKey: [
			"rp-application-developer-invitations",
			workspaceUuid,
			rpApplicationUuid,
		],
		queryFn: () =>
			getRPApplicationDeveloperInvitations(workspaceUuid, rpApplicationUuid),
		enabled: !!workspaceUuid && !!rpApplicationUuid,
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
	const invitationsErrorNotice = getRequestErrorNotice(
		invitationsQueryError as Error | null | undefined,
		{
			bodyKey: "workspaces.errorLoadingDeveloperInvitations",
			titleKey: "workspaces.errorLoadingDeveloperInvitations",
		}
	);

	const closeCreateModal = (): void => {
		setInviteDeveloperEmail("");
		setIsCreateModalOpen(false);
	};

	const handleBackToApplication = (): void => {
		void navigate({
			params: { rpApplicationUuid, workspaceUuid },
			to: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid",
		});
	};

	const handleCreateInvitation = async (): Promise<void> => {
		if (!application) {
			return;
		}

		setIsCreatingInvitation(true);
		try {
			await inviteRPApplicationDeveloper(
				workspaceUuid,
				application.uuid,
				inviteDeveloperEmail.trim()
			);
			await refetchInvitations();
			toast.success(t("workspaces.inviteDeveloperSuccess"));
			closeCreateModal();
		} catch (error) {
			toast.error(getRequestErrorMessage(error, t("errors.unknown")));
		} finally {
			setIsCreatingInvitation(false);
		}
	};

	const handleRevokeInvitation = async (): Promise<void> => {
		if (!invitationToRevoke) {
			return;
		}

		setIsRevokingInvitation(true);
		try {
			await revokeRPApplicationDeveloperInvitation(
				workspaceUuid,
				rpApplicationUuid,
				invitationToRevoke.uuid
			);
			await refetchInvitations();
			toast.success(t("workspaces.revokeDeveloperInvitationSuccess"));
			setInvitationToRevoke(null);
		} catch (error) {
			toast.error(getRequestErrorMessage(error, t("errors.unknown")));
		} finally {
			setIsRevokingInvitation(false);
		}
	};

	const handleResendInvitation = async (
		invitation: RPApplicationDeveloperInvitationManagementRead
	): Promise<void> => {
		try {
			await resendRPApplicationDeveloperInvitation(
				workspaceUuid,
				rpApplicationUuid,
				invitation.uuid
			);
			await refetchInvitations();
			toast.success(
				invitation.status === "revoked"
					? t("workspaces.reactivateDeveloperInvitationSuccess")
					: t("workspaces.resendDeveloperInvitationSuccess")
			);
		} catch (error) {
			toast.error(getRequestErrorMessage(error, t("errors.unknown")));
		}
	};

	if (
		isWorkspaceLoading ||
		isApplicationsLoading ||
		isInvitationsLoading
	) {
		return (
			<CenteredPageLayout className="max-w-5xl">
				<Text>{t("workspaces.loadingDeveloperInvitations")}</Text>
			</CenteredPageLayout>
		);
	}

	if (!workspace || !application) {
		return (
			<CenteredPageLayout className="max-w-5xl">
				<Notice
					noticeRole="danger"
					noticeTitle={t("workspaces.errorLoadingApplications")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.errorLoadingApplications")}</Text>
				</Notice>
			</CenteredPageLayout>
		);
	}

	const departmentName =
		getLocalizedDepartmentName(department, i18n.language) ?? "-";
	const invitationColumns: Array<
		DataTableColumn<RPApplicationDeveloperInvitationManagementRead>
	> = [
		{
			field: "invitedEmail",
			headerName: t("workspaces.inviteDeveloperEmailLabel"),
		},
		{
			field: "createdAt",
			headerName: t("workspaces.developerInvitationSentAt"),
			valueFormatter: (row) => formatDateTime(row.createdAt, i18n.language),
		},
		{
			field: "inviteExpiresAt",
			headerName: t("workspaces.developerInvitationExpiresAt"),
			valueFormatter: (row) =>
				formatDateTime(row.inviteExpiresAt, i18n.language),
		},
		{
			field: "status",
			headerName: t("workspaces.developerInvitationStatus"),
			valueFormatter: (row) => getStatusLabel(row.status, t),
		},
	];
	const invitationActions = isWorkspaceAdmin
		? [
				{
					buttonId: (row: RPApplicationDeveloperInvitationManagementRead): string =>
						`resend-invitation-${row.uuid}`,
					buttonLabel: t("workspaces.resendDeveloperInvitation"),
					isVisible: (row: RPApplicationDeveloperInvitationManagementRead): boolean =>
						row.status === "pending" || row.status === "expired",
					onAction: (row: RPApplicationDeveloperInvitationManagementRead): void => {
						void handleResendInvitation(row);
					},
					variant: "link" as const,
				},
				{
					buttonId: (row: RPApplicationDeveloperInvitationManagementRead): string =>
						`reactivate-invitation-${row.uuid}`,
					buttonLabel: t("workspaces.reactivateDeveloperInvitation"),
					isVisible: (row: RPApplicationDeveloperInvitationManagementRead): boolean =>
						row.status === "revoked",
					onAction: (row: RPApplicationDeveloperInvitationManagementRead): void => {
						void handleResendInvitation(row);
					},
					variant: "link" as const,
				},
				{
					buttonId: (row: RPApplicationDeveloperInvitationManagementRead): string =>
						`revoke-invitation-${row.uuid}`,
					buttonLabel: t("workspaces.revokeDeveloperInvitation"),
					isVisible: (row: RPApplicationDeveloperInvitationManagementRead): boolean =>
						row.status === "pending" || row.status === "expired",
					onAction: (row: RPApplicationDeveloperInvitationManagementRead): void => {
						setInvitationToRevoke(row);
					},
					variant: "link" as const,
				},
			]
		: [];

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
					{
						href: `/workspaces/${workspaceUuid}/applications/${rpApplicationUuid}/developers`,
						label: t("workspaces.manageDeveloperInvitations"),
					},
				]}
			/>
			<div className="flex flex-col gap-300">
				<div className="flex items-start justify-between gap-200">
					<div>
						<Heading tag="h1">
							{t("workspaces.developerInvitationsTitle", {
								name: application.name,
							})}
						</Heading>
						<Text>{t("workspaces.developerInvitationsSummary")}</Text>
						<div className="grid gap-100 md:grid-cols-[minmax(0,180px)_minmax(0,1fr)] md:items-start">
							<Text>{t("workspaces.workspaceName")}</Text>
							<Text>{workspace.name}</Text>
							<Text>{t("workspaces.applicationNameLabel")}</Text>
							<Text>{application.name}</Text>
							<Text>{t("workspaces.department")}</Text>
							<Text>{departmentName}</Text>
						</div>
					</div>
					<div className="flex gap-150">
						<Button buttonRole="secondary" type="button" onGcdsClick={handleBackToApplication}>
							{t("workspaces.backToApplication")}
						</Button>
						{isWorkspaceAdmin ? (
							<Button
								type="button"
								onGcdsClick={(): void => {
									setIsCreateModalOpen(true);
								}}
							>
								{t("workspaces.inviteDeveloper")}
							</Button>
						) : null}
					</div>
				</div>

				{isWorkspaceError && workspaceErrorNotice ? (
					<Notice
						noticeRole={workspaceErrorNotice.noticeRole}
						noticeTitle={t(workspaceErrorNotice.titleKey)}
						noticeTitleTag="h2"
					>
						<Text>
							{workspaceErrorNotice.bodyText ??
								t(workspaceErrorNotice.bodyKey)}
						</Text>
					</Notice>
				) : null}
				{isApplicationsError && applicationsErrorNotice ? (
					<Notice
						noticeRole={applicationsErrorNotice.noticeRole}
						noticeTitle={t(applicationsErrorNotice.titleKey)}
						noticeTitleTag="h2"
					>
						<Text>
							{applicationsErrorNotice.bodyText ??
								t(applicationsErrorNotice.bodyKey)}
						</Text>
					</Notice>
				) : null}
				{isInvitationsError && invitationsErrorNotice ? (
					<Notice
						noticeRole={invitationsErrorNotice.noticeRole}
						noticeTitle={t(invitationsErrorNotice.titleKey)}
						noticeTitleTag="h2"
					>
						<Text>
							{invitationsErrorNotice.bodyText ??
								t(invitationsErrorNotice.bodyKey)}
						</Text>
					</Notice>
				) : null}

				<section className={detailCardClasses}>
					{!isInvitationsError && invitations && invitations.length > 0 ? (
						<DataTable<RPApplicationDeveloperInvitationManagementRead>
							action={invitationActions}
							actionColumnWidth={{ max: 420, min: 320 }}
							columns={invitationColumns}
							getRowId={(row) => row.uuid}
							itemLabel="developer invitations"
							pagination={false}
							rows={invitations}
							title={t("workspaces.manageDeveloperInvitations")}
							primaryAction={
								isWorkspaceAdmin
									? {
										buttonLabel: t("workspaces.inviteDeveloper"),
										onAction: (): void => {
											setIsCreateModalOpen(true);
										},
									}
									: undefined
							}
						/>
					) : !isInvitationsError ? (
						<Notice
							noticeRole="info"
							noticeTitle={t("workspaces.developerInvitationsEmpty")}
							noticeTitleTag="h3"
						>
							<div />
						</Notice>
					) : null}
				</section>

				<Modal
					description={t("workspaces.inviteDeveloperBody")}
					isOpen={isCreateModalOpen}
					title={t("workspaces.inviteDeveloperModalTitle")}
					footer={
						<>
							<Button buttonRole="secondary" type="button" onGcdsClick={closeCreateModal}>
								{t("common.cancel")}
							</Button>
							<Button
								type="button"
								disabled={
									isCreatingInvitation || inviteDeveloperEmail.trim().length === 0
								}
								onGcdsClick={() => {
									void handleCreateInvitation();
								}}
							>
								{t("common.save")}
							</Button>
						</>
					}
					onClose={closeCreateModal}
				>
					<Input
						hint={t("workspaces.inviteDeveloperBody")}
						inputId="invite-developer-email"
						label={t("workspaces.inviteDeveloperEmailLabel")}
						name="invite-developer-email"
						type="email"
						value={inviteDeveloperEmail}
						onInput={(event): void => {
							setInviteDeveloperEmail(
								(event.target as HTMLInputElement).value
							);
						}}
					/>
				</Modal>

				<ConfirmDialog
					cancelLabel={t("common.cancel")}
					confirmLabel={t("workspaces.revokeDeveloperInvitation")}
					isOpen={invitationToRevoke !== null}
					isPending={isRevokingInvitation}
					title={t("workspaces.revokeDeveloperInvitationConfirmTitle")}
					description={t("workspaces.revokeDeveloperInvitationConfirmBody", {
						email: invitationToRevoke?.invitedEmail ?? "",
					})}
					onClose={(): void => {
						setInvitationToRevoke(null);
					}}
					onConfirm={(): void => {
						void handleRevokeInvitation();
					}}
				/>
			</div>
		</CenteredPageLayout>
	);
};