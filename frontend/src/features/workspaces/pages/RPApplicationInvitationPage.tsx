import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { CenteredPageLayout } from "@/components/layout";
import { Button, Heading, Notice, Text } from "@/components/ui";
import { getRequestErrorNotice } from "@/fetch";
import {
	acceptRPApplicationDeveloperInvitation,
	getCurrentUserRPApplications,
} from "@/fetch/workspaces";

const invitationRouteApi = getRouteApi("/invitations/rp-applications");

export const RPApplicationInvitationPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { token } = invitationRouteApi.useSearch();
	const acceptQuery = useQuery({
		enabled: typeof token === "string" && token.length > 0,
		queryKey: ["rp-application-invitation", token],
		queryFn: () => acceptRPApplicationDeveloperInvitation(token!),
		retry: false,
	});
	const applicationsQuery = useQuery({
		enabled: typeof acceptQuery.data?.rp_application_id === "number",
		queryKey: ["dashboard-rp-applications"],
		queryFn: getCurrentUserRPApplications,
	});

	useEffect(() => {
		if (!acceptQuery.data || !applicationsQuery.data) {
			return;
		}

		const matchedApplication = applicationsQuery.data.find(
			(application) => application.id === acceptQuery.data.rp_application_id
		);
		if (!matchedApplication) {
			return;
		}

		void navigate({
			params: { rpApplicationUuid: matchedApplication.uuid },
			to: "/rp-applications/mine/$rpApplicationUuid",
		});
	}, [acceptQuery.data, applicationsQuery.data, navigate]);

	const errorNotice = getRequestErrorNotice(
		acceptQuery.error ?? applicationsQuery.error,
		{
			bodyKey: "invitations.rpApplication.errorBody",
			titleKey: "invitations.rpApplication.errorTitle",
		}
	);

	if (!token) {
		return (
			<CenteredPageLayout className="max-w-3xl gap-400">
				<Heading tag="h1">{t("invitations.rpApplication.title")}</Heading>
				<Notice
					noticeRole="danger"
					noticeTitle={t("invitations.rpApplication.missingTokenTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("invitations.rpApplication.missingTokenBody")}</Text>
				</Notice>
			</CenteredPageLayout>
		);
	}

	return (
		<CenteredPageLayout className="max-w-3xl gap-400">
			<Heading tag="h1">{t("invitations.rpApplication.title")}</Heading>
			{acceptQuery.isLoading || applicationsQuery.isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("invitations.rpApplication.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("invitations.rpApplication.loadingBody")}</Text>
				</Notice>
			) : null}
			{errorNotice ? (
				<Notice
					noticeRole={errorNotice.noticeRole}
					noticeTitle={t(errorNotice.titleKey as never)}
					noticeTitleTag="h2"
				>
					<Text>{errorNotice.bodyText ?? t(errorNotice.bodyKey as never)}</Text>
				</Notice>
			) : null}
			{acceptQuery.isSuccess && !applicationsQuery.isLoading ? (
				<Notice
					noticeRole="success"
					noticeTitle={t("invitations.rpApplication.successTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("invitations.rpApplication.successBody")}</Text>
				</Notice>
			) : null}
			<div>
				<Button href="/dashboard" type="link">
					{t("invitations.rpApplication.dashboardAction")}
				</Button>
			</div>
		</CenteredPageLayout>
	);
};