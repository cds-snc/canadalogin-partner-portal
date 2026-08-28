import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Heading, Notice, Text } from "@/components/ui";
import { acceptPreparedRPApplicationDeveloperInvitation } from "@/fetch/rp-application-developer-invitations";

type InvitationPageStatus = "error" | "loading" | "success";
type InvitationRequestStatus = "error" | "success" | null;

export const RPApplicationInvitationPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [requestStatus, setRequestStatus] =
		useState<InvitationRequestStatus>(null);
	const [workspaceUuid, setWorkspaceUuid] = useState<string | null>(null);
	const status: InvitationPageStatus = requestStatus ?? "loading";

	useEffect((): (() => void) => {
		let isActive = true;
		let redirectTimeout: number | undefined;

		void acceptPreparedRPApplicationDeveloperInvitation()
			.then((response): void => {
				if (!isActive) {
					return;
				}

				const destinationMatch = /^\/workspaces\/([0-9a-f-]+)$/iu.exec(
					response.nextDestination
				);
				const destinationWorkspaceUuid = destinationMatch?.[1] ?? null;
				setWorkspaceUuid(destinationWorkspaceUuid);
				setRequestStatus("success");
				redirectTimeout = globalThis.setTimeout((): void => {
					if (destinationWorkspaceUuid) {
						void navigate({
							params: { workspaceUuid: destinationWorkspaceUuid },
							replace: true,
							to: "/workspaces/$workspaceUuid",
						});
						return;
					}
					void navigate({ replace: true, to: "/workspaces" });
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
	}, [navigate]);

	const renderNotice = (): FunctionComponent => {
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
					<Button
						buttonRole="primary"
						type="link"
						href={
							workspaceUuid
								? `/workspaces/${encodeURIComponent(workspaceUuid)}`
								: "/workspaces"
						}
					>
						{t("invitations.rpApplication.dashboardAction")}
					</Button>
				</div>
			) : null}
		</>
	);
};
