import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Card, Grid, Heading, Link, Notice, Pagination, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { getCurrentUserApplications } from "@/fetch/applications";
import { useSession } from "@/hooks";
import { useQuery } from "@tanstack/react-query";

const APPLICATIONS_PER_PAGE = 10;

export const ApplicationsPage = (): FunctionComponent => {
	const { i18n, t } = useTranslation();
	const { currentUser, isLoading: isSessionLoading } = useSession();
	const [currentPage, setCurrentPage] = useState(1);
	const {
		data: applications,
		error: applicationsError,
		isLoading: isApplicationsLoading,
	} = useQuery({
		enabled: Boolean(currentUser?.uuid),
		queryFn: () =>
			getCurrentUserApplications({
				itemsPerPage: APPLICATIONS_PER_PAGE,
				page: currentPage,
			}),
		queryKey: ["applications", currentUser?.uuid, currentPage],
	});
	const isLoading = isSessionLoading || isApplicationsLoading;
	const errorNotice = getRequestErrorNotice(applicationsError, {
		bodyKey: "applications.errorBody",
		titleKey: "applications.errorTitle",
	});
	const totalPages = Math.ceil(
		(applications?.totalCount ?? 0) / (applications?.itemsPerPage ?? APPLICATIONS_PER_PAGE)
	);
	const page = applications?.page ?? currentPage;
	const visibleApplications = applications?.data ?? [];

	if (isLoading) {
		return (
			<Grid columns="1fr" container="md" tag="div">
				<Heading tag="h1">{t("applications.title")}</Heading>
				<Notice
					noticeRole="info"
					noticeTitle={t("applications.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("applications.loadingBody")}</Text>
				</Notice>
			</Grid>
		);
	}

	return (
		<Grid columns="1fr" container="md" tag="div">
			<Heading marginBottom="0" tag="h1">
				{t("applications.title")}
			</Heading>

			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey as never)}</Text>
				</Notice>
			) : null}

			{currentUser && !errorNotice ? (
				visibleApplications.length > 0 ? (
					<>
						<Text marginTop="300">
							{t("applications.summary")}
						</Text>
						<Grid columns="1fr" tag="div">
							{visibleApplications.map((application) => {
								const applicationName =
									i18n.resolvedLanguage === "fr" && application.nameFr
										? application.nameFr
										: application.nameEn;

								return (
									<Card
										key={application.uuid}
										cardTitle={applicationName}
										cardTitleTag="h3"
										href={`/applications/${application.uuid}/environments`}
										description={t("applications.environmentCount", {
											count: application.environmentCount,
										})}
									/>
								);
							})}
						</Grid>
						<Pagination
							currentPage={page}
							label={t("applications.paginationLabel")}
							totalPages={totalPages}
							onPageChange={setCurrentPage}
						/>
					</>
				) : (
					<Text marginTop="300">
						<strong>{t("applications.emptyTitle")}</strong>
						<br />
						{t("applications.emptyContactPrefix")}
						<Link href="/support">
							{t("applications.supportLink")}
						</Link>
						{t("applications.emptyContactSuffix")}
					</Text>
				)
			) : null}
		</Grid>
	);
};