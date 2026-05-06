import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Heading, Notice, Text } from "@/components/ui";
import { CenteredPageLayout } from "@/components/layout";
import { getRequestErrorNotice } from "@/fetch";
import { useSession, useUserTier } from "@/hooks";

export const AccessPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { currentUser } = useSession();
	const { error, isLoading, tier } = useUserTier(currentUser?.uuid);
	const errorNotice = getRequestErrorNotice(error, {
		bodyKey: "access.errorBody",
		titleKey: "access.errorTitle",
	});

	return (
		<CenteredPageLayout className="max-w-5xl">
			<Heading tag="h1">{t("access.title")}</Heading>
			<Text>{t("access.summary")}</Text>

			{isLoading ? (
				<Notice noticeRole="info" noticeTitle={t("access.loadingTitle")} noticeTitleTag="h2">
					<Text>{t("access.loadingBody")}</Text>
				</Notice>
			) : null}

			{errorNotice ? (
				<Notice noticeRole={errorNotice.noticeRole} noticeTitle={t(errorNotice.titleKey as never)} noticeTitleTag="h2">
					<Text>{t(errorNotice.bodyKey as never)}</Text>
				</Notice>
			) : null}

			{!isLoading && !error && !tier ? (
				<Notice noticeRole="warning" noticeTitle={t("access.emptyTitle")} noticeTitleTag="h2">
					<Text>{t("access.emptyBody")}</Text>
				</Notice>
			) : null}

			{tier ? (
				<Notice noticeRole="success" noticeTitle={t("access.cardTitle")} noticeTitleTag="h2">
					<div className="flex flex-col gap-200">
						<Text>{t("access.username", { value: tier.username })}</Text>
						<Text>{t("access.tierName", { value: tier.tierName })}</Text>
						<Text>{t("access.tierCreatedAt", { value: tier.tierCreatedAt })}</Text>
					</div>
				</Notice>
			) : null}
		</CenteredPageLayout>
	);
};