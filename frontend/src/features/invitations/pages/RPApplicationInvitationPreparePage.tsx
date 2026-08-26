import { useLayoutEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Heading, Notice, Text } from "@/components/ui";
import { prepareRPApplicationDeveloperInvitation } from "@/fetch/rp-application-developer-invitations";
import { consumeInvitationTokenFragment } from "@/features/invitations/invitation-fragment";

type PreparationStatus = "error" | "loading" | "missing-token";

export const RPApplicationInvitationPreparePage = (): FunctionComponent => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [status, setStatus] = useState<PreparationStatus>("loading");

	useLayoutEffect((): (() => void) => {
		let isActive = true;
		const token = consumeInvitationTokenFragment();

		if (!token) {
			globalThis.queueMicrotask(() => {
				if (isActive) {
					setStatus("missing-token");
				}
			});
			return () => {
				isActive = false;
			};
		}

		void prepareRPApplicationDeveloperInvitation(token)
			.then((): void => {
				if (isActive) {
					void navigate({
						replace: true,
						to: "/invitations/rp-applications/accept",
					});
				}
			})
			.catch((): void => {
				if (isActive) {
					setStatus("error");
				}
			});

		return () => {
			isActive = false;
		};
	}, [navigate]);

	const notice =
		status === "missing-token"
			? {
					body: t("invitations.rpApplication.missingTokenBody"),
					role: "warning" as const,
					title: t("invitations.rpApplication.missingTokenTitle"),
				}
			: status === "error"
				? {
						body: t("invitations.rpApplication.errorBody"),
						role: "danger" as const,
						title: t("invitations.rpApplication.errorTitle"),
					}
				: {
						body: t("invitations.rpApplication.loadingBody"),
						role: "info" as const,
						title: t("invitations.rpApplication.loadingTitle"),
					};

	return (
		<>
			<Heading tag="h1">{t("invitations.rpApplication.title")}</Heading>
			<Notice
				noticeRole={notice.role}
				noticeTitle={notice.title}
				noticeTitleTag="h2"
			>
				<Text>{notice.body}</Text>
			</Notice>
		</>
	);
};
