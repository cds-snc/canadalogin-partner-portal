import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { CenteredPageLayout } from "@/components/layout";
import { Button, Heading, Notice, Text } from "@/components/ui";

export const AccessDeniedPage = (): FunctionComponent => {
	const { t } = useTranslation();

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
			<div>
				<Button href="/login" type="link">
					{t("accessDenied.action")}
				</Button>
			</div>
		</CenteredPageLayout>
	);
};