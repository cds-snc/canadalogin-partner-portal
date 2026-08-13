import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { Button, DataTable, Heading, Notice, Text } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import { getRequestErrorNotice } from "@/fetch";
import { useRPRegistrationAdoptionCandidates } from "../hooks/use-rp-registration-adoption";

type AdoptionCandidateRow = {
	configurationName: string;
	ibmApplicationId: string;
	metadataCompleteness: string;
	partnerEnvironment: string;
	rpApplicationUuid: string;
};

export const RPRegistrationAdoptionListPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as {
		t: (
			key: string | Array<string>,
			options?: Record<string, unknown>
		) => string;
	};
	useDocumentTitle(t("rpRegistrationAdoption.title"), t("home.title"));
	const navigate = useNavigate();
	const { candidates, error, isLoading } =
		useRPRegistrationAdoptionCandidates();
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "rpRegistrationAdoption.listErrorBody",
		titleKey: "rpRegistrationAdoption.listErrorTitle",
	});
	const rows: Array<AdoptionCandidateRow> = candidates.map((candidate) => ({
		configurationName: candidate.configurationName,
		ibmApplicationId: candidate.ibmApplicationId,
		metadataCompleteness: t(
			`rpRegistrationAdoption.completeness.${candidate.metadataCompleteness}`
		),
		partnerEnvironment:
			candidate.partnerEnvironment?.trim() || t("common.notProvided"),
		rpApplicationUuid: candidate.rpApplicationUuid,
	}));
	const columns: Array<DataTableColumn<AdoptionCandidateRow>> = [
		{
			field: "configurationName",
			headerName: t("rpRegistrationAdoption.nameColumn"),
		},
		{
			field: "partnerEnvironment",
			headerName: t("rpRegistrationAdoption.partnerEnvironmentColumn"),
		},
		{
			field: "ibmApplicationId",
			headerName: t("rpRegistrationAdoption.ibmApplicationIdColumn"),
		},
		{
			field: "metadataCompleteness",
			headerName: t("rpRegistrationAdoption.completenessColumn"),
		},
	];

	return (
		<>
			<Heading tag="h1">{t("rpRegistrationAdoption.title")}</Heading>
			<Text>{t("rpRegistrationAdoption.summary")}</Text>

			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("rpRegistrationAdoption.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("rpRegistrationAdoption.loadingBody")}</Text>
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

			{!isLoading && !error && candidates.length === 0 ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("rpRegistrationAdoption.emptyTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("rpRegistrationAdoption.emptyBody")}</Text>
					<Button buttonRole="secondary" href="/workspaces" type="link">
						{t("rpRegistrationAdoption.backToWorkspaces")}
					</Button>
				</Notice>
			) : null}

			{candidates.length > 0 ? (
				<DataTable
					columns={columns}
					itemLabel={t("rpRegistrationAdoption.itemLabel")}
					rows={rows}
					title={t("rpRegistrationAdoption.tableTitle")}
					action={{
						buttonLabel: t("rpRegistrationAdoption.reviewAction"),
						onAction: (row): void => {
							void navigate({
								params: {
									rpApplicationUuid: row.rpApplicationUuid,
								},
								to: "/workspaces/rp-registration-adoption/$rpApplicationUuid",
							});
						},
						screenReaderLabel: (row): string => row.configurationName,
					}}
				/>
			) : null}
		</>
	);
};
