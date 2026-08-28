import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Button, Heading, Notice, Text } from "@/components/ui";

export const AccessDeniedPage = (): FunctionComponent => {
	const { t } = useTranslation();

	const onSignOutClick = (): void => {
		window.location.href = "/logout";
	};

	return (
		<>
			<Heading tag="h1">{t("accessDenied.title")}</Heading>
			<Notice
				noticeRole="warning"
				noticeTitle={t("accessDenied.noticeTitle")}
				noticeTitleTag="h2"
			>
				<Text>{t("accessDenied.summary")}</Text>
			</Notice>
			<Text>{t("accessDenied.body")}</Text>
			<div>
				<Button buttonRole="primary" type="button" onGcdsClick={onSignOutClick}>
					{t("accessDenied.action")}
				</Button>
			</div>
		</>
	);
};
