import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { Button, Heading, Link, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import {
	getAccessibleMauReportDestinations,
	type MAUReportDestinationRead,
} from "@/fetch/mau-report";
import {
	buildRPConfigurationPublicReferences,
	getLocalizedRPApplicationName,
} from "@/features/rp-applications/rp-application-summary";
import { getCanadaLoginEnvironmentLabel } from "@/features/workspaces/onboarding-display";

const getApplicationLabel = (
	application: MAUReportDestinationRead,
	language: string,
	fallback: string
): string =>
	getLocalizedRPApplicationName(
		{
			serviceNameEn: application.applicationNameEn,
			serviceNameFr: application.applicationNameFr,
		},
		language
	) || fallback;

export const ApplicationReportsChooserPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	useDocumentTitle(t("reports.applicationsChooser.title"), t("home.title"));
	const { data, error, isLoading, refetch } = useQuery({
		queryFn: getAccessibleMauReportDestinations,
		queryKey: ["reports", "mau-report-destinations"],
	});
	const reportApplications = data ?? [];
	const language = i18n?.resolvedLanguage ?? i18n?.language ?? "en";
	const publicReferences = buildRPConfigurationPublicReferences(
		reportApplications.map((application) => ({
			...application,
			serviceNameEn: application.applicationNameEn,
			serviceNameFr: application.applicationNameFr,
		})),
		language,
		t("reports.applicationsChooser.unknownConfiguration")
	);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "reports.applicationsChooser.errorBody",
		titleKey: "reports.applicationsChooser.errorTitle",
	});

	return (
		<div className="grid gap-400">
			<div>
				<Heading tag="h1">{t("reports.applicationsChooser.title")}</Heading>
				<Text>{t("reports.applicationsChooser.summary")}</Text>
			</div>

			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("reports.applicationsChooser.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("reports.applicationsChooser.loadingBody")}</Text>
				</Notice>
			) : errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey as never)}</Text>
					<Button
						buttonRole="secondary"
						type="button"
						onGcdsClick={() => void refetch()}
					>
						{t("reports.applicationsChooser.retryAction")}
					</Button>
				</Notice>
			) : reportApplications.length === 0 ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("reports.applicationsChooser.emptyTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("reports.applicationsChooser.emptyBody")}</Text>
				</Notice>
			) : (
				<ul className="m-0 grid list-none gap-200 p-0">
					{reportApplications.map((application) => (
						<li
							key={application.uuid}
							className="grid gap-100 rounded-sm border border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)] p-300"
						>
							<Heading tag="h2">
								<Link
									href={`/workspaces/${encodeURIComponent(application.workspaceUuid)}/applications/${encodeURIComponent(application.applicationInformationUuid ?? "")}/rp-configurations/${encodeURIComponent(application.uuid)}/usage`}
								>
									{application.configurationName.trim() ||
										getApplicationLabel(
											application,
											language,
											t("reports.applicationsChooser.unknownConfiguration")
										)}
								</Link>
							</Heading>
							<Text>
								{t("reports.applicationsChooser.workspaceContext", {
									name: application.workspaceName,
								})}
							</Text>
							<Text>
								{t("reports.applicationsChooser.applicationContext", {
									name: getApplicationLabel(
										application,
										language,
										t("reports.applicationsChooser.unknownApplication")
									),
								})}
							</Text>
							<Text>
								{t("reports.applicationsChooser.partnerEnvironmentContext", {
									environment:
										application.partnerEnvironment?.trim() ||
										t("common.notProvided"),
								})}
							</Text>
							<Text>
								{t("reports.applicationsChooser.environmentContext", {
									environment: application.canadaLoginEnvironment
										? getCanadaLoginEnvironmentLabel(
												t as never,
												application.canadaLoginEnvironment
											)
										: t("common.notAvailable"),
								})}
							</Text>
							{publicReferences.get(application.uuid) ? (
								<Text>
									{t("reports.applicationsChooser.referenceContext", {
										reference: publicReferences.get(application.uuid),
									})}
								</Text>
							) : null}
						</li>
					))}
				</ul>
			)}

			<Link href="/reports">{t("reports.backToHub")}</Link>
		</div>
	);
};
