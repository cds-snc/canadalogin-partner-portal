import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Heading, Notice, Text } from "@/components/ui";
import { CenteredPageLayout } from "@/components/layout";

export const AuthCompletePage = (): FunctionComponent => {
	const { t } = useTranslation();

	return (
		<CenteredPageLayout className="max-w-2xl">
			<Heading tag="h1">{t("authComplete.title")}</Heading>
			<Notice
				noticeRole="info"
				noticeTitle={t("authComplete.noticeTitle")}
				noticeTitleTag="h2"
			>
				<Text>{t("authComplete.summary")}</Text>
			</Notice>
		</CenteredPageLayout>
	);
};
