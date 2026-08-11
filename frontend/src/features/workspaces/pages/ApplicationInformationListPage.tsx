import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, DataTable, Heading, Notice, Text } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { getRequestErrorNotice } from "@/fetch";
import { useWorkspace } from "../hooks/use-workspace";
import { useWorkspaceApplicationInformationList } from "../hooks/use-workspace-application-information";
import { getWorkspaceOnboardingStateLabel } from "../onboarding-display";

type ApplicationInformationRow = {
	onboardingState: string;
	serviceNameEn: string;
	serviceNameFr: string;
	uuid: string;
};

export const ApplicationInformationListPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const navigate = useNavigate();
	const { workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/application-information",
	});
	const search = useSearch({
		from: "/workspaces/$workspaceUuid/application-information",
	});
	const { workspace } = useWorkspace(workspaceUuid);
	const {
		applicationInformationRecords,
		error,
		isLoading,
	} = useWorkspaceApplicationInformationList(workspaceUuid);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "workspaces.appInfoErrorBody",
		titleKey: "workspaces.appInfoErrorTitle",
	});
	const successMessage =
		search.deleted === "1" ? t("workspaces.appInfoDeletedSuccess") : null;
	const rows: Array<ApplicationInformationRow> =
		applicationInformationRecords.map((applicationInformation) => ({
			onboardingState: applicationInformation.onboardingState?.trim()
				? getWorkspaceOnboardingStateLabel(t, applicationInformation.onboardingState)
				: t("common.notAvailable"),
			serviceNameEn: applicationInformation.serviceNameEn,
			serviceNameFr: applicationInformation.serviceNameFr,
			uuid: applicationInformation.uuid,
		}));
	const columns: Array<DataTableColumn<ApplicationInformationRow>> = [
		{
			field: "serviceNameEn",
			headerName: t("workspaces.appInfoServiceNameEnLabel"),
		},
		{
			field: "serviceNameFr",
			headerName: t("workspaces.appInfoServiceNameFrLabel"),
		},
		{
			field: "onboardingState",
			headerName: t("workspaces.onboardingStateColumn"),
		},
	];

	return (
		<>
			<Heading tag="h1">
				{workspace
					? t("workspaces.appInfoListTitle", { name: workspace.name })
					: t("workspaces.appInfoSectionTitle")}
			</Heading>
			<Text>{t("workspaces.appInfoListSummary")}</Text>

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

			{!isLoading && !error && applicationInformationRecords.length === 0 ? (
				<Notice
					noticeRole="warning"
					noticeTitle={t("workspaces.appInfoEmptyTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("workspaces.appInfoEmptyBody")}</Text>
					<div className="mt-200">
						<Button
							href={`/workspaces/${workspaceUuid}/application-information/new`}
							type="link"
						>
							{t("workspaces.appInfoCreateButton")}
						</Button>
					</div>
				</Notice>
			) : null}

			{applicationInformationRecords.length > 0 ? (
				<DataTable
					columns={columns}
					getRowId={(row): string => row.uuid}
					itemLabel="application information records"
					rows={rows}
					title={t("workspaces.appInfoSectionTitle")}
					action={{
						buttonLabel: t("workspaces.viewAction"),
						onAction: (row): void => {
							void navigate({
								params: {
									applicationInformationUuid: row.uuid,
									workspaceUuid,
								},
								to: "/workspaces/$workspaceUuid/application-information/$applicationInformationUuid",
							});
						},
						screenReaderLabel: (row): string => row.serviceNameEn,
					}}
					primaryAction={{
						buttonLabel: t("workspaces.appInfoCreateButton"),
						onAction: (): void => {
							void navigate({
								params: { workspaceUuid },
								to: "/workspaces/$workspaceUuid/application-information/new",
							});
						},
					}}
				/>
			) : null}
		</>
	);
};