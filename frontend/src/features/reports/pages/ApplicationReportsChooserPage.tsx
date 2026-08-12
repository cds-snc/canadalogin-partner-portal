import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { Button, Heading, Link, Notice, Text } from "@/components/ui";
import {
	getPartnerAccessForWorkspace,
	roleAllows,
} from "@/features/auth/authorization";
import { accessibleRPApplicationsQueryKey } from "@/features/your-applications/query-keys";
import { getRequestErrorNotice } from "@/fetch";
import {
	getAccessibleRPApplications,
	type RPApplicationSummaryRead,
} from "@/fetch/rp-applications";
import { useSession } from "@/hooks";
import { getLocalizedRPApplicationName } from "@/features/rp-applications/rp-application-summary";

const getApplicationLabel = (
	application: RPApplicationSummaryRead,
	language: string,
	fallback: string
): string =>
	getLocalizedRPApplicationName(application, language) || fallback;

export const ApplicationReportsChooserPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const { currentUser } = useSession();
	useDocumentTitle(t("reports.applicationsChooser.title"), t("home.title"));
	const { data, error, isLoading, refetch } = useQuery({
		enabled: Boolean(currentUser?.uuid),
		queryFn: getAccessibleRPApplications,
		queryKey: accessibleRPApplicationsQueryKey,
	});
	const authorizationContext = currentUser?.authorizationContext;
	const reportApplications = (data ?? []).filter((application) => {
		const sessionAccess = getPartnerAccessForWorkspace(
			authorizationContext,
			application.workspaceUuid
		);
		return (
			application.role !== null &&
			application.role !== undefined &&
			sessionAccess?.role === application.role &&
			roleAllows(application.role, "mau_report_read")
		);
	});
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

			{!currentUser || isLoading ? (
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
				<ul className="space-y-400">
					{reportApplications.map((application) => (
						<li key={application.uuid}>
							<Heading tag="h2">
								<Link
									href={`/workspaces/${encodeURIComponent(application.workspaceUuid)}/applications/${encodeURIComponent(application.uuid)}/usage`}
								>
									{getApplicationLabel(
										application,
										i18n?.resolvedLanguage ?? i18n?.language ?? "en",
										t("reports.applicationsChooser.unknownApplication")
									)}
								</Link>
							</Heading>
						</li>
					))}
				</ul>
			)}

			<Link href="/reports">{t("reports.backToHub")}</Link>
		</div>
	);
};
