import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { CenteredPageLayout } from "@/components/layout";
import { Button, Heading, Notice, Text } from "@/components/ui";

export const AccessDeniedPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const [secondsRemaining, setSecondsRemaining] = useState(10);
	const hasSignedOut = useRef(false);

	const triggerSignOut = useCallback((): void => {
		if (hasSignedOut.current) {
			return;
		}

		hasSignedOut.current = true;
		window.location.href = "/logout";
	}, []);

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
		<CenteredPageLayout className="max-w-3xl gap-400">
			<Heading tag="h1">{t("accessDenied.title")}</Heading>
			<Notice
				noticeRole="warning"
				noticeTitle={t("accessDenied.noticeTitle")}
				noticeTitleTag="h2"
			>
				<Text>{t("accessDenied.summary")}</Text>
			</Notice>
			<Text>{t("accessDenied.body")}</Text>
			<Text>{t("accessDenied.countdown", { seconds: secondsRemaining })}</Text>
			<div>
				<Button buttonRole="primary" type="button" onGcdsClick={onSignOutClick}>
					{t("accessDenied.action")}
				</Button>
			</div>
		</CenteredPageLayout>
	);
};
