import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { CenteredPageLayout } from "@/components/layout";
import { Button, Heading, Notice, Text } from "@/components/ui";
import { useSession } from "@/hooks";

export const AccessDeniedPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { logout } = useSession();
	const navigate = useNavigate();
	const [secondsRemaining, setSecondsRemaining] = useState(10);
	const hasSignedOut = useRef(false);

	const triggerSignOut = async (): Promise<void> => {
		if (hasSignedOut.current) {
			return;
		}

		hasSignedOut.current = true;
		await logout();
		await navigate({ replace: true, to: "/" });
	};

	useEffect(() => {
		const countdownInterval = globalThis.setInterval(() => {
			setSecondsRemaining((current) => {
				if (current <= 1) {
					globalThis.clearInterval(countdownInterval);
					return 0;
				}

				return current - 1;
			});
		}, 1000);

		return () => {
			globalThis.clearInterval(countdownInterval);
		};
	}, []);

	useEffect(() => {
		if (secondsRemaining !== 0) {
			return;
		}

		void triggerSignOut();
	}, [secondsRemaining]);

	const onSignOutClick = (): void => {
		void triggerSignOut();
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
