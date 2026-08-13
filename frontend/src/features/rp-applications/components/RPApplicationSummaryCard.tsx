import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { DataTable } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui/DataTable";
import type { RPApplicationSummaryRead } from "@/fetch/rp-applications";
import {
	buildRPConfigurationPublicReferences,
	getRPConfigurationDisplayName,
} from "../rp-application-summary";

const formatTokenLabel = (value: string): string =>
	value.trim().replace(/_/g, " ").replace(/\s+/g, " ");

const environmentLabelKey = (value: string): string | null => {
	switch (value.trim().toLowerCase()) {
		case "test":
			return "yourApplications.environmentTest";
		case "staging":
			return "yourApplications.environmentStaging";
		case "production":
			return "yourApplications.environmentProduction";
		default:
			return null;
	}
};

const onboardingLabelKey = (value: string): string | null => {
	switch (value.trim().toLowerCase()) {
		case "draft":
			return "yourApplications.onboardingStateDraft";
		case "submitted":
			return "yourApplications.onboardingStateSubmitted";
		case "under_review":
			return "yourApplications.onboardingStateUnderReview";
		case "approved":
			return "yourApplications.onboardingStateApproved";
		case "launched":
			return "yourApplications.onboardingStateLaunched";
		default:
			return null;
	}
};

type RPConfigurationTableRow = Record<string, unknown> & {
	actionHref: string;
	canadaLoginEnvironment: string;
	name: string;
	partnerEnvironment: string;
	publicReference: string | null;
	status: string;
	uuid: string;
};

type RPApplicationSummaryTableProps = {
	applications: ReadonlyArray<RPApplicationSummaryRead>;
	label: string;
};

const getDetailsHref = (application: RPApplicationSummaryRead): string =>
	application.applicationInformationUuid
		? `/workspaces/${encodeURIComponent(application.workspaceUuid)}/applications/${encodeURIComponent(application.applicationInformationUuid)}/rp-configurations/${encodeURIComponent(application.uuid)}`
		: "/error?kind=not_found";

export const RPApplicationSummaryTable = ({
	applications,
	label,
}: RPApplicationSummaryTableProps): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const language = i18n?.resolvedLanguage ?? i18n?.language ?? "en";
	const publicReferences = buildRPConfigurationPublicReferences(
		applications,
		language,
		t("yourApplications.unknownApplication")
	);
	const rows: Array<RPConfigurationTableRow> = applications.map(
		(application) => {
			const detailsHref = getDetailsHref(application);
			const canadaLoginEnvironment =
				application.canadaLoginEnvironment?.trim() ?? "";
			const environmentKey = environmentLabelKey(canadaLoginEnvironment);
			const onboardingState = application.onboardingState?.trim() ?? "";
			const onboardingKey = onboardingLabelKey(onboardingState);

			return {
				actionHref: detailsHref,
				canadaLoginEnvironment: canadaLoginEnvironment
					? environmentKey
						? t(environmentKey as never)
						: formatTokenLabel(canadaLoginEnvironment)
					: t("common.notProvided"),
				name: getRPConfigurationDisplayName(
					application,
					language,
					t("yourApplications.unknownApplication")
				),
				partnerEnvironment:
					application.partnerEnvironment?.trim() || t("common.notProvided"),
				publicReference: publicReferences.get(application.uuid) ?? null,
				status: onboardingState
					? onboardingKey
						? t(onboardingKey as never)
						: formatTokenLabel(onboardingState)
					: t("common.notProvided"),
				uuid: application.uuid,
			};
		}
	);
	const columns: Array<DataTableColumn<RPConfigurationTableRow>> = [
		{
			field: "name",
			headerName: t("workspaces.rpConfigurationNameColumn"),
			sortable: true,
			cellRenderer: (row): ReactNode => (
				<div className="grid min-w-0 gap-50">
					<span className="font-bold break-words">{row.name}</span>
					{row.publicReference ? (
						<small className="break-all">
							{t("yourApplications.publicReferenceLabel")}:{" "}
							{row.publicReference}
						</small>
					) : null}
				</div>
			),
		},
		{
			field: "partnerEnvironment",
			headerName: t("workspaces.rpConfigurationPartnerEnvironmentColumn"),
			sortable: true,
		},
		{
			field: "canadaLoginEnvironment",
			headerName: t("workspaces.rpConfigurationCanadaLoginEnvironmentColumn"),
			sortable: true,
		},
		{
			field: "status",
			headerName: t("workspaces.rpConfigurationStatusColumn"),
			sortable: true,
		},
	];

	return (
		<DataTable
			sort
			actionHeader={t("workspaces.rpConfigurationActionColumn")}
			columns={columns}
			filter={false}
			pagination={false}
			rows={rows}
			title={label}
			action={{
				buttonLabel: t("workspaces.rpConfigurationOpenAction"),
				buttonRole: "secondary",
				href: (row): string => row.actionHref,
				screenReaderLabel: (row): string =>
					t("workspaces.rpConfigurationActionNameContext", {
						name: row.name,
					}),
			}}
			itemLabel={t("workspaces.rpConfigurationsItemLabel", {
				count: rows.length,
			})}
		/>
	);
};

// Compatibility export for callers migrating from the earlier summary-list
// name; the rendered pattern is now the compact GCDS comparison table.
export const RPApplicationSummaryList = RPApplicationSummaryTable;
