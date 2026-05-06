import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { getLocalizedDepartmentName } from "@/common/get-localized-department-name";
import type { FunctionComponent } from "@/common/types";
import { Breadcrumbs, CenteredPageLayout } from "@/components/layout";
import { Button, ConfirmDialog, DataTable, Heading, Notice, Text } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/features/auth/hooks/use-session";
import { ApplicationContactModal } from "@/features/workspaces/components/ApplicationContactModal";
import { getRequestErrorMessage } from "@/fetch";
import { getDepartmentById } from "@/fetch/departments";
import {
	applicationInfoContactsQueryKey,
	deleteWorkspaceApplicationContact,
	getWorkspaceApplicationContacts,
	getWorkspaceApplicationInfos,
	type ApplicationContactRead,
} from "@/fetch/application-info";
import { getWorkspaceMembers, getWorkspaces } from "@/fetch/workspaces";

const detailCardClasses =
	"rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] px-400 py-350 shadow-[0_14px_28px_rgba(38,55,74,0.06)]";

export const ApplicationContactsManagementPage = (): FunctionComponent => {
	const { t, i18n } = useTranslation() as unknown as {
		t: (key: string, options?: Record<string, unknown>) => string;
		i18n: {
			language: string;
		};
	};
	const { applicationInfoUuid, workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/application-info/$applicationInfoUuid/contacts/",
	});
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const toast = useToast();
	const { currentUser } = useSession();
	const [contactToDelete, setContactToDelete] =
		useState<ApplicationContactRead | null>(null);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isDeletingContact, setIsDeletingContact] = useState(false);

	const { data: workspace, isLoading: isWorkspaceLoading } = useQuery({
		queryKey: ["workspace", workspaceUuid],
		queryFn: () =>
			getWorkspaces().then((workspaces) =>
				workspaces.find((workspaceItem) => workspaceItem.uuid === workspaceUuid)
			),
		enabled: !!workspaceUuid,
	});

	const { data: applicationInfos, isLoading: isApplicationInfoLoading } = useQuery({
		queryKey: ["workspace-application-info", workspaceUuid],
		queryFn: () => getWorkspaceApplicationInfos(workspaceUuid),
		enabled: !!workspaceUuid,
	});

	const { data: contacts, isLoading: isContactsLoading, refetch: refetchContacts } = useQuery({
		queryKey: applicationInfoContactsQueryKey(workspaceUuid, applicationInfoUuid),
		queryFn: () =>
			getWorkspaceApplicationContacts(workspaceUuid, applicationInfoUuid),
		enabled: !!workspaceUuid && !!applicationInfoUuid,
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

	const handleDeleteContact = async (): Promise<void> => {
		if (!contactToDelete) {
			return;
		}

		setIsDeletingContact(true);
		try {
			await deleteWorkspaceApplicationContact(
				workspaceUuid,
				applicationInfoUuid,
				contactToDelete.uuid
			);
			await queryClient.invalidateQueries({
				queryKey: applicationInfoContactsQueryKey(
					workspaceUuid,
					applicationInfoUuid
				),
			});
			toast.success(t("workspaces.appInfoContactDeletedSuccess"));
			setContactToDelete(null);
		} catch (error) {
			toast.error(getRequestErrorMessage(error, t("errors.unknown")));
		} finally {
			setIsDeletingContact(false);
		}
	};

	if (isWorkspaceLoading || isApplicationInfoLoading || isContactsLoading) {
		return (
			<CenteredPageLayout className="max-w-5xl">
				<Text>{t("workspaces.loadingApplicationInfo")}</Text>
			</CenteredPageLayout>
		);
	}

	if (!workspace || !applicationInfo) {
		return (
			<CenteredPageLayout className="max-w-5xl">
				<Notice
					noticeRole="danger"
					noticeTitle={t("workspaces.errorLoadingApplicationInfo")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.errorLoadingApplicationInfo")}</Text>
				</Notice>
			</CenteredPageLayout>
		);
	}

	const contactActions = isWorkspaceAdmin
		? [
				{
					buttonId: (row: ApplicationContactRead): string =>
						`edit-contact-${row.uuid}`,
					buttonLabel: t("workspaces.appInfoContactEdit"),
					onAction: (row: ApplicationContactRead): void => {
						void navigate({
							params: {
								applicationContactUuid: row.uuid,
								applicationInfoUuid,
								workspaceUuid,
							},
							to: "/workspaces/$workspaceUuid/application-info/$applicationInfoUuid/contacts/$applicationContactUuid",
						});
					},
					variant: "link" as const,
				},
				{
					buttonId: (row: ApplicationContactRead): string =>
						`delete-contact-${row.uuid}`,
					buttonLabel: t("workspaces.appInfoContactDelete"),
					onAction: (row: ApplicationContactRead): void => {
						setContactToDelete(row);
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
						href: `/workspaces/${workspaceUuid}/application-info/${applicationInfoUuid}`,
						label: applicationInfo.applicationName,
					},
					{
						href: `/workspaces/${workspaceUuid}/application-info/${applicationInfoUuid}/contacts`,
						label: t("workspaces.appInfoContacts"),
					},
				]}
			/>
			<div className="flex flex-col gap-300">
				<div className="flex items-start justify-between gap-200">
					<div>
						<Heading tag="h1">{t("workspaces.appInfoContacts")}</Heading>
						<div className="grid gap-100 md:grid-cols-[minmax(0,180px)_minmax(0,1fr)] md:items-start">
							<Text>{t("workspaces.workspaceName")}</Text>
							<Text>{workspace.name}</Text>
							<Text>{t("workspaces.appInfoApplicationNameLabel")}</Text>
							<Text>{applicationInfo.applicationName}</Text>
							<Text>{t("workspaces.department")}</Text>
							<Text>{departmentName}</Text>
						</div>
					</div>
					<div className="flex gap-150">
						<Button
							buttonRole="secondary"
							type="button"
							onGcdsClick={(): void =>
								void navigate({
									params: { applicationInfoUuid, workspaceUuid },
									to: "/workspaces/$workspaceUuid/application-info/$applicationInfoUuid",
								})
							}
						>
							{t("workspaces.backToApplication")}
						</Button>
						{isWorkspaceAdmin ? (
							<Button
								type="button"
								onGcdsClick={(): void => { setIsCreateModalOpen(true); }}
							>
								{t("workspaces.appInfoCreateContact")}
							</Button>
						) : null}
					</div>
				</div>

				<section className={detailCardClasses}>
					{contacts && contacts.length > 0 ? (
						<DataTable<ApplicationContactRead>
							action={contactActions}
							actionColumnWidth={{ max: 420, min: 320 }}
							itemLabel="application contacts"
							pagination={false}
							rows={contacts}
							title={t("workspaces.appInfoContacts")}
							columns={[
								{
									field: "firstName",
									headerName: t("workspaces.appInfoContactFirstNameLabel"),
								},
								{
									field: "lastName",
									headerName: t("workspaces.appInfoContactLastNameLabel"),
								},
								{
									field: "email",
									headerName: t("workspaces.appInfoContactEmailLabel"),
								},
							]}
						/>
					) : (
						<Notice
							noticeRole="info"
							noticeTitle={t("workspaces.appInfoContactsEmpty")}
							noticeTitleTag="h3"
						>
							<div />
						</Notice>
					)}
				</section>

				<ApplicationContactModal
					applicationInfoUuid={applicationInfoUuid}
					isOpen={isCreateModalOpen}
					mode="create"
					workspaceUuid={workspaceUuid}
					onClose={(): void => { setIsCreateModalOpen(false); }}
					onSaved={async (): Promise<void> => {
						await refetchContacts();
					}}
				/>

				<ConfirmDialog
					cancelLabel={t("common.cancel")}
					confirmLabel={t("workspaces.delete")}
					isOpen={contactToDelete !== null}
					isPending={isDeletingContact}
					title={t("workspaces.appInfoContactDeleteConfirmTitle")}
					description={t("workspaces.appInfoContactDeleteConfirmBody", {
						name: contactToDelete?.email ?? "",
					})}
					onClose={(): void => { setContactToDelete(null); }}
					onConfirm={(): void => {
						void handleDeleteContact();
					}}
				/>
			</div>
		</CenteredPageLayout>
	);
};