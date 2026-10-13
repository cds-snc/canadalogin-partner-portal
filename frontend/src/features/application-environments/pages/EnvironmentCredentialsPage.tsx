import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Grid, Heading, Notice, Tabs, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import { useApplicationEnvironment } from "../hooks/use-application-environment";

export const EnvironmentCredentialsPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { applicationUuid, environmentUuid } = useParams({
		from: "/applications/$applicationUuid/environments/$environmentUuid",
	});
	const { data: environment, error, isLoading } = useApplicationEnvironment(
		applicationUuid,
		environmentUuid
	);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "applicationEnvironmentManagement.errorBody",
		titleKey: "applicationEnvironmentManagement.errorTitle",
	});

	return (
		<Grid columns="1fr" container="xl" tag="div">
			<Tabs
				ariaLabel={t("applicationEnvironmentManagement.tabsLabel")}
				items={[
					{
						href: `/applications/${applicationUuid}/environments/${environmentUuid}`,
						label: t("applicationEnvironmentManagement.configurationTab"),
					},
					{
						active: true,
						href: `/applications/${applicationUuid}/environments/${environmentUuid}/credentials`,
						label: t("applicationEnvironmentManagement.credentialsTab"),
					},
				]}
			/>
			<Heading tag="h1">
				{t("applicationEnvironmentManagement.credentialsTitle")}
			</Heading>
			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("applicationEnvironmentManagement.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("applicationEnvironmentManagement.loadingBody")}</Text>
				</Notice>
			) : errorNotice || !environment ? (
				<Notice
					noticeRole={errorNotice?.noticeRole ?? "danger"}
					noticeTitleTag="h2"
					noticeTitle={
						errorNotice
						? t(errorNotice.titleKey as never)
						: t("applicationEnvironmentManagement.errorTitle")
					}
				>
					<Text>
						{errorNotice
							? (errorNotice.bodyText ?? t(errorNotice.bodyKey as never))
							: t("applicationEnvironmentManagement.errorBody")}
					</Text>
				</Notice>
			) : (
				<>
					<Text>{environment.partnerLabel}</Text>
					<Notice
						noticeRole="info"
						noticeTitleTag="h2"
						noticeTitle={t(
							"applicationEnvironmentManagement.credentialsComingSoonTitle"
						)}
					>
						<Text>
							{t(
								"applicationEnvironmentManagement.credentialsComingSoonBody"
							)}
						</Text>
					</Notice>
				</>
			)}
		</Grid>
	);
};