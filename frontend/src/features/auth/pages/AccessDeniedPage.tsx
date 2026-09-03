import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Heading, Notice, Text } from "@/components/ui";
import { buildApiUrl } from "@/fetch/base-url";
import { useAuthStore } from "@/store";

type AccessDeniedReason = "concurrent-session-limit";

type AccessDeniedPageProps = {
	reason?: AccessDeniedReason;
};

export const AccessDeniedPage = ({ reason }: AccessDeniedPageProps): FunctionComponent => {
	const { t } = useTranslation();
	const reset = useAuthStore((state) => state.reset);
	const [secondsRemaining, setSecondsRemaining] = useState(10);
	const hasSignedOut = useRef(false);
	const isConcurrentSessionLimit = reason === "concurrent-session-limit";
	const noticeTitle = isConcurrentSessionLimit
		? t("accessDenied.concurrentSessionNoticeTitle")
		: t("accessDenied.noticeTitle");
	const summary = isConcurrentSessionLimit
		? t("accessDenied.concurrentSessionSummary")
		: t("accessDenied.summary");
	const body = isConcurrentSessionLimit
		? t("accessDenied.concurrentSessionBody")
		: t("accessDenied.body");

	const triggerSignOut = useCallback((): void => {
		if (hasSignedOut.current) {
			return;
		}

		hasSignedOut.current = true;
		reset();
		window.location.href = buildApiUrl("/api/v1/logout");
	}, [reset]);

	useEffect((): (() => void) => {
		const countdownInterval = globalThis.setInterval(() => {
			setSecondsRemaining((current) => {
				if (current <= 1) {
					globalThis.clearInterval(countdownInterval);
					return 0;
				}

				return current - 1;
			});
		}, 1000);

		return (): void => {
			globalThis.clearInterval(countdownInterval);
		};
	}, []);

	useEffect((): void => {
		if (secondsRemaining !== 0) {
			return;
		}

		triggerSignOut();
	}, [secondsRemaining, triggerSignOut]);

	const onSignOutClick = (): void => {
		triggerSignOut();
	};

	return (
		<>
			<Heading tag="h1">{t("accessDenied.title")}</Heading>
			<Notice
				noticeRole="warning"
				noticeTitle={noticeTitle}
				noticeTitleTag="h2"
			>
				<Text>{summary}</Text>
			</Notice>
			<Text>{body}</Text>
			<Text>{t("accessDenied.countdown", { seconds: secondsRemaining })}</Text>
			<div>
				<Button buttonRole="primary" type="button" onGcdsClick={onSignOutClick}>
					{t("accessDenied.action")}
				</Button>
			</div>
		</>
	);
};
