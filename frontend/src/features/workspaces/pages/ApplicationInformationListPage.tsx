import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { normalizeLanguageCode } from "@/common/language";
import type { FunctionComponent } from "@/common/types";
import { Button, DataTable, Heading, Notice, Text } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { getRequestErrorNotice } from "@/fetch";
import { hasCapability } from "@/features/auth/authorization";
import { useSession } from "@/hooks";
import { useWorkspace } from "../hooks/use-workspace";
import { useWorkspaceApplicationInformationList } from "../hooks/use-workspace-application-information";
import { getWorkspaceOnboardingStateLabel } from "../onboarding-display";

type ApplicationInformationRow = {
	name: string;
	onboardingState: string;
	uuid: string;
};

export const ApplicationInformationListPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation() as unknown as {
		i18n: { language?: string; resolvedLanguage?: string };
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	const language = normalizeLanguageCode(
		i18n.resolvedLanguage ?? i18n.language
	);
	const navigate = useNavigate();
	const { currentUser } = useSession();
	const { workspaceUuid } = useParams({
		from: "/workspaces/$workspaceUuid/applications",
	});
	const search = useSearch({
		from: "/workspaces/$workspaceUuid/applications",
	});
	const { workspace } = useWorkspace(workspaceUuid);
	const { applicationInformationRecords, error, isLoading } =
		useWorkspaceApplicationInformationList(workspaceUuid);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "workspaces.appInfoErrorBody",
		titleKey: "workspaces.appInfoErrorTitle",
	});
	const successMessage =
		search.deleted === "1" ? t("workspaces.appInfoDeletedSuccess") : null;
	const canCreateApplicationInformation = hasCapability(
		currentUser?.authorizationContext,
		"application_information_write",
		workspaceUuid
	);
	const canCreateConfiguration = hasCapability(
		currentUser?.authorizationContext,
		"rp_configuration_write",
		workspaceUuid
	);
	const rows: Array<ApplicationInformationRow> =
		applicationInformationRecords.map((applicationInformation) => ({
			name:
				(language === "fr"
					? applicationInformation.serviceNameFr
					: applicationInformation.serviceNameEn
				).trim() || t("common.notAvailable"),
			onboardingState: applicationInformation.onboardingState?.trim()
				? getWorkspaceOnboardingStateLabel(
						t,
						applicationInformation.onboardingState
					)
				: t("common.notAvailable"),
			uuid: applicationInformation.uuid,
		}));
	const columns: Array<DataTableColumn<ApplicationInformationRow>> = [
		{
			field: "name",
			headerName: t("workspaces.appInfoServiceNameLabel"),
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
					{canCreateApplicationInformation ? (
						<div className="mt-200">
							<Button
								href={`/workspaces/${workspaceUuid}/applications/new`}
								type="link"
							>
								{t("workspaces.appInfoCreateButton")}
							</Button>
						</div>
					) : null}
				</Notice>
			) : null}

			{applicationInformationRecords.length > 0 ? (
				<DataTable
					columns={columns}
					itemLabel={t("workspaces.applicationInformationItemLabel")}
					rows={rows}
					title={t("workspaces.appInfoSectionTitle")}
					action={[
						{
							buttonLabel: t("workspaces.appInfoViewAction"),
							onAction: (row): void => {
								void navigate({
									params: {
										applicationInformationUuid: row.uuid,
										workspaceUuid,
									},
									to: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid",
								});
							},
							screenReaderLabel: (row): string => row.name,
						},
						{
							buttonLabel: t("workspaces.rpConfigurationAddAction"),
							isVisible: (): boolean => canCreateConfiguration,
							onAction: (row): void => {
								void navigate({
									params: {
										applicationInformationUuid: row.uuid,
										workspaceUuid,
									},
									to: "/workspaces/$workspaceUuid/applications/$applicationInformationUuid/rp-configurations/new",
								});
							},
							screenReaderLabel: (row): string => row.name,
						},
					]}
					primaryAction={
						canCreateApplicationInformation
							? {
									buttonLabel: t("workspaces.appInfoCreateButton"),
									onAction: (): void => {
										void navigate({
											params: { workspaceUuid },
											to: "/workspaces/$workspaceUuid/applications/new",
										});
									},
								}
							: undefined
					}
				/>
			) : null}
		</>
	);
};
