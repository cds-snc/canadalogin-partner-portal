import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Card, Grid, Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { getCurrentUserRPApplications } from "@/fetch/rp-applications";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks";

export const YourApplicationsPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { currentUser, isLoading: isSessionLoading } = useSession();
	const {
		data: rpApplications,
		error: applicationsError,
		isLoading: isApplicationsLoading,
	} = useQuery({
		enabled: Boolean(currentUser?.uuid),
		queryFn: getCurrentUserRPApplications,
		queryKey: ["your-applications-rp-applications"],
	});
	const isLoading = isSessionLoading || isApplicationsLoading;
	const errorNotice = getRequestErrorNotice(applicationsError, {
		bodyKey: "yourApplications.errorBody",
		titleKey: "yourApplications.errorTitle",
	});
	if (isLoading) {
		return (
			<>
				<Heading tag="h1">{t("yourApplications.title")}</Heading>
				<Notice
					noticeRole="info"
					noticeTitle={t("yourApplications.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("yourApplications.loadingBody")}</Text>
				</Notice>
			</>
		);
	}

	return (
		<Grid columns="1fr" tag="div">
			<Heading tag="h1">{t("yourApplications.title")}</Heading>
			<Text>{t("yourApplications.summary")}</Text>

			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey as never)}</Text>
				</Notice>
			) : null}

			{currentUser ? (
				<>
					{(rpApplications ?? []).length > 0 ? (
						<div className="flex flex-col gap-200">
							{(rpApplications ?? []).map((application) => (
								<Card
									key={application.uuid}
									cardTitleTag="h3"
									href={`/your-applications/${application.uuid}`}
									cardTitle={
										application.dnrAppName?.trim() ||
										application.name?.trim() ||
										application.ibm_sv_application_id ||
										t("yourApplications.unknownApplication")
									}
								/>
							))}
						</div>
					) : (
						<Text>{t("yourApplications.noRPApplications")}</Text>
					)}
				</>
			) : null}
		</Grid>
	);
};
