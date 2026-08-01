import { useMemo } from "react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, DataTable, Heading, Notice, Text } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { getRequestErrorNotice } from "@/fetch";
import { useWorkspaceApplicationInformationList } from "../hooks/use-workspace-application-information";
import { useWorkspace } from "../hooks/use-workspace";
import { useWorkspaceRPApplications } from "../hooks/use-workspace-rp-applications";

type RPApplicationRow = {
	environment: string;
	linkedApplicationInformation: string;
	name: string;
	status: string;
	uuid: string;
};

export const WorkspaceApplicationsListPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const { workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications",
	});
	const search = useSearch({
		from: "/workspaces/$workspaceUuid/applications",
	});
	const { workspace } = useWorkspace(workspaceUuid);
	const { applicationInformationRecords } =
		useWorkspaceApplicationInformationList(workspaceUuid);
	const { applications, error, isLoading } =
		useWorkspaceRPApplications(workspaceUuid);
	const applicationInformationById = useMemo(
		() =>
			new Map(
				applicationInformationRecords.map((applicationInformation) => [
					applicationInformation.id,
					applicationInformation,
				])
			),
		[applicationInformationRecords]
	);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "workspaces.applicationsErrorBody",
		titleKey: "workspaces.applicationsErrorTitle",
	});
	const successMessage =
		search.deleted === "1" ? t("workspaces.applicationDeletedSuccess") : null;
	const rows: Array<RPApplicationRow> = applications.map((application) => ({
		environment:
			application.canada_login_environment ?? t("common.notAvailable"),
		linkedApplicationInformation:
			(application.application_information_id
				? applicationInformationById.get(application.application_information_id)
						?.serviceNameEn
				: null) ?? t("workspaces.applicationsNoLinkedInfo"),
		name: application.dnr_app_name,
		status: application.status ?? t("common.notAvailable"),
		uuid: application.uuid,
	}));
	const columns: Array<DataTableColumn<RPApplicationRow>> = [
		{
			field: "name",
			headerName: t("workspaces.applicationsNameColumn"),
		},
		{
			field: "environment",
			headerName: t("workspaces.applicationsEnvironmentColumn"),
		},
		{
			field: "status",
			headerName: t("workspaces.applicationsStatusColumn"),
		},
		{
			field: "linkedApplicationInformation",
			headerName: t("workspaces.applicationsLinkedInfoColumn"),
		},
	];

	return (
		<>
			<Heading tag="h1">
				{workspace
					? t("workspaces.applicationsListTitle", { name: workspace.name })
					: t("workspaces.applicationsSectionTitle")}
			</Heading>
			<Text>{t("workspaces.applicationsListSummary")}</Text>
			<div>
				<Button
					href={`/workspaces/${workspaceUuid}/applications/new`}
					type="link"
				>
					{t("workspaces.applicationsCreateAction")}
				</Button>
			</div>

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

			{!isLoading && !error && applications.length === 0 ? (
				<Notice
					noticeRole="warning"
					noticeTitle={t("workspaces.applicationsEmptyTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.applicationsEmptyBody")}</Text>
					<div className="mt-200">
						<Button
							href={`/workspaces/${workspaceUuid}/applications/new`}
							type="link"
						>
							{t("workspaces.applicationsCreateAction")}
						</Button>
					</div>
				</Notice>
			) : null}

			{applications.length > 0 ? (
				<DataTable
					columns={columns}
					getRowId={(row): string => row.uuid}
					itemLabel="workspace RP applications"
					pagination={false}
					rows={rows}
					title={t("workspaces.applicationsSectionTitle")}
					action={{
						buttonLabel: t("workspaces.applicationsViewAction"),
						onAction: (row): void => {
							void navigate({
								params: { rpApplicationUuid: row.uuid, workspaceUuid },
								to: "/workspaces/$workspaceUuid/applications/$rpApplicationUuid",
							});
						},
						screenReaderLabel: (row): string => row.name,
					}}
				/>
			) : null}
		</>
	);
};
