import { useState, type ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "@tanstack/react-router";
import { getLocalizedDepartmentName } from "@/common/get-localized-department-name";
import type { FunctionComponent } from "@/common/types";
import { Breadcrumbs, CenteredPageLayout } from "@/components/layout";
import { Button, DataTable, Heading, Notice, Text } from "@/components/ui";
import { ApplicationInfoModal } from "@/features/workspaces/components/ApplicationInfoModal";
import {
	WorkspaceApplicationModal,
	type WorkspaceApplicationCreateContext,
} from "@/features/workspaces/components/WorkspaceApplicationModal";
import { useSession } from "@/features/auth/hooks/use-session";
import { getRequestErrorNotice } from "@/fetch";
import {
	getWorkspaceApplicationInfos,
	type ApplicationInfoRead,
	workspaceApplicationInfoQueryKey,
} from "@/fetch/application-info";
import { getDepartmentById } from "@/fetch/departments";
import {
	getWorkspaceMembers,
	getWorkspaces,
} from "@/fetch/workspaces";

const buildCreateApplicationContext = (
	applicationInfo: ApplicationInfoRead
): WorkspaceApplicationCreateContext => ({
	applicationInfoUuid: applicationInfo.uuid,
	initialForm: {
		applicationUrl: applicationInfo.applicationUrl,
		description: applicationInfo.applicationDescription,
		name: applicationInfo.applicationName,
	},
});

export const WorkspaceDetailPage = (): FunctionComponent => {
	const { t, i18n } = useTranslation() as unknown as {
		t: (key: string | Array<string>, opts?: Record<string, unknown>) => string;
		i18n: {
			language: string;
		};
	};
	const { workspaceUuid } = useParams({ from: "/workspaces/$workspaceUuid/" });
	const navigate = useNavigate();
	const { currentUser } = useSession();

	const [createModalContext, setCreateModalContext] =
		useState<WorkspaceApplicationCreateContext | null>(null);
	const [isApplicationInfoModalOpen, setIsApplicationInfoModalOpen] =
		useState(false);

	const {
		data: workspace,
		error: workspaceQueryError,
		isLoading: workspaceLoading,
		isError: workspaceError,
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
		isLoading: applicationInfosLoading,
		isError: applicationInfosError,
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

	const handleOpenApplicationInfoModal = (): void => {
		setIsApplicationInfoModalOpen(true);
	};

	const handleManageApplication = (rpApplicationUuid: string): void => {
		void navigate({
			params: {
				rpApplicationUuid,
				workspaceUuid,
			},
			to: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid",
		});
	};

	const handleManageOrCreateApplication = (
		applicationInfo: ApplicationInfoRead
	): void => {
		if (applicationInfo.rpApplicationUuid) {
			handleManageApplication(applicationInfo.rpApplicationUuid);
			return;
		}

		setCreateModalContext(buildCreateApplicationContext(applicationInfo));
	};

	const handleManageApplicationContacts = (
		applicationInfo: ApplicationInfoRead
	): void => {
		void navigate({
			params: {
				applicationInfoUuid: applicationInfo.uuid,
				workspaceUuid,
			},
			to: "/workspaces/$workspaceUuid/application-info/$applicationInfoUuid/contacts",
		});
	};

	const handleManageApplicationInfo = (
		applicationInfo: ApplicationInfoRead
	): void => {
		void navigate({
			params: {
				applicationInfoUuid: applicationInfo.uuid,
				workspaceUuid,
			},
			to: "/workspaces/$workspaceUuid/application-info/$applicationInfoUuid",
		});
	};

	const availableApplicationInfos = applicationInfos ?? [];

	const renderActionLink = (
		buttonId: string,
		buttonLabel: string,
		onClick: () => void
	): ReactElement | null => {
		if (!isWorkspaceAdmin) {
			return null;
		}

		return (
			<button
				className="government-data-table__action government-data-table__action--link"
				id={buttonId}
				type="button"
				onClick={onClick}
			>
				{buttonLabel}
			</button>
		);
	};

	const handleBack = (): void => {
		void navigate({ to: "/workspaces" });
	};

	if (workspaceLoading) {
		return (
			<CenteredPageLayout className="max-w-5xl">
				<Text>{t("workspaces.loading")}</Text>
			</CenteredPageLayout>
		);
	}

	if (workspaceError || !workspace) {
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

	return (
		<CenteredPageLayout className="max-w-5xl">
			<Breadcrumbs
				items={[
					{ href: "/", label: t("nav.home") },
					{ href: "/workspaces", label: t("workspaces.title") },
					{ href: `/workspaces/${workspaceUuid}`, label: workspace.name },
				]}
			/>
			<div className="flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<div />
					<Button buttonRole="secondary" type="button" onGcdsClick={handleBack}>
						{t("workspaces.back")}
					</Button>
				</div>

				<div>
					<Heading tag="h1">
						{t("workspaces.workspaceTitle", { name: workspace.name })}
					</Heading>
					<Text>{departmentName}</Text>
				</div>

				<div className="border-t pt-6">
					<div className="mb-4 flex items-center justify-between">
						<Heading tag="h2">{t("workspaces.appInfoSectionTitle")}</Heading>
						{isWorkspaceAdmin ? (
							<Button
								type="button"
								onGcdsClick={handleOpenApplicationInfoModal}
							>
								{t("workspaces.appInfoCreateButton")}
							</Button>
						) : null}
					</div>

					{applicationInfosLoading ? (
						<Text>{t("workspaces.loadingApplicationInfo")}</Text>
					) : null}

					{applicationInfosError ? (
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
					) : null}

					{!applicationInfosLoading &&
					!applicationInfosError &&
					availableApplicationInfos.length === 0 ? (
						<Notice
							noticeRole="info"
							noticeTitle={t("workspaces.noApplicationInfo")}
							noticeTitleTag="h2"
						>
							<div></div>
						</Notice>
					) : null}

					{!applicationInfosLoading &&
					!applicationInfosError &&
					availableApplicationInfos.length > 0 ? (
						<DataTable<ApplicationInfoRead>
							itemLabel="application information records"
							pagination={false}
							rows={availableApplicationInfos}
							title={t("workspaces.appInfoSectionTitle")}
							action={
								isWorkspaceAdmin
									? {
										buttonId: (row: ApplicationInfoRead): string =>
											`manage-application-info-${row.uuid}`,
										buttonLabel: t("workspaces.appInfoActionLink"),
										onAction: (row: ApplicationInfoRead): void => {
											handleManageApplicationInfo(row);
										},
										variant: "link",
									}
									: []
							}
							columns={[
								{
									field: "applicationName",
									headerName: t("workspaces.appInfoColumnLabel"),
								},
								{
									field: "uuid",
									headerName: t("workspaces.appInfoContactsColumnLabel"),
									minWidth: 180,
									sortable: false,
									filter: false,
									cellRenderer: (row): ReactElement | null =>
										renderActionLink(
											`manage-application-info-contacts-${row.uuid}`,
											t("workspaces.appInfoManageContacts"),
											(): void => {
												handleManageApplicationContacts(row);
											}
										),
								},
								{
									field: "rpApplicationUuid",
									headerName: t("workspaces.appInfoRpColumnLabel"),
									minWidth: 220,
									sortable: false,
									filter: false,
									cellRenderer: (row): ReactElement | null =>
										renderActionLink(
											row.rpApplicationUuid
												? `manage-application-${row.uuid}`
												: `create-application-${row.uuid}`,
											row.rpApplicationUuid
												? t("workspaces.appInfoManageRp")
												: t("workspaces.appInfoCreateRp"),
											(): void => {
												handleManageOrCreateApplication(row);
											}
										),
								},
							]}
						/>
					) : null}
				</div>

				<WorkspaceApplicationModal
					application={null}
					createContext={createModalContext}
					isOpen={createModalContext !== null}
					mode="create"
					workspaceUuid={workspaceUuid}
					onClose={() => {
						setCreateModalContext(null);
					}}
					onSaved={async () => {
						await refetchApplicationInfos();
					}}
				/>

				<ApplicationInfoModal
					isOpen={isApplicationInfoModalOpen}
					workspaceUuid={workspaceUuid}
					organizationLabel={getLocalizedDepartmentName(
						department,
						i18n.language,
						undefined
					)}
					onClose={() => {
						setIsApplicationInfoModalOpen(false);
					}}
					onSaved={async () => {
						await refetchApplicationInfos();
					}}
				/>
			</div>
		</CenteredPageLayout>
	);
};
