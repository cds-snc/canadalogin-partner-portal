import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Heading, Notice, Text } from "@/components/ui";
import { acceptRPApplicationDeveloperInvitation } from "@/fetch/rp-application-developer-invitations";

type InvitationPageStatus = "error" | "loading" | "missing-token" | "success";
type InvitationRequestStatus = "error" | "success" | null;

type RPApplicationInvitationPageProps = {
	token?: string;
};

export const RPApplicationInvitationPage = ({
	token,
}: RPApplicationInvitationPageProps): FunctionComponent => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [requestStatus, setRequestStatus] = useState<InvitationRequestStatus>(null);
	const status: InvitationPageStatus = !token
		? "missing-token"
		: requestStatus ?? "loading";

	useEffect((): (() => void) | void => {
		if (!token) {
			return;
		}

		let isActive = true;
		let redirectTimeout: number | undefined;

		void acceptRPApplicationDeveloperInvitation(token)
			.then((): void => {
				if (!isActive) {
					return;
				}

				setRequestStatus("success");
				redirectTimeout = globalThis.setTimeout((): void => {
					void navigate({ replace: true, to: "/your-applications" });
				}, 1500);
			})
			.catch((): void => {
				if (!isActive) {
					return;
				}

				setRequestStatus("error");
			});

		return () => {
			isActive = false;
			if (redirectTimeout !== undefined) {
				globalThis.clearTimeout(redirectTimeout);
			}
		};
	}, [navigate, token]);

	const renderNotice = (): FunctionComponent => {
		if (status === "missing-token") {
			return (
				<Notice
					noticeRole="warning"
					noticeTitle={t("invitations.rpApplication.missingTokenTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("invitations.rpApplication.missingTokenBody")}</Text>
				</Notice>
			);
		}

		if (status === "success") {
			return (
				<Notice
					noticeRole="success"
					noticeTitle={t("invitations.rpApplication.successTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("invitations.rpApplication.successBody")}</Text>
				</Notice>
			);
		}

		if (status === "error") {
			return (
				<Notice
					noticeRole="danger"
					noticeTitle={t("invitations.rpApplication.errorTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("invitations.rpApplication.errorBody")}</Text>
				</Notice>
			);
		}

		return (
			<Notice
				noticeRole="info"
				noticeTitle={t("invitations.rpApplication.loadingTitle")}
				noticeTitleTag="h2"
			>
				<Text>{t("invitations.rpApplication.loadingBody")}</Text>
			</Notice>
		);
	};

	return (
		<>
			<Heading tag="h1">{t("invitations.rpApplication.title")}</Heading>
			{renderNotice()}
			{status === "success" || status === "error" ? (
				<div>
					<Button buttonRole="primary" href="/your-applications" type="link">
						{t("invitations.rpApplication.dashboardAction")}
					</Button>
				</div>
			) : null}
		</>
	);
};