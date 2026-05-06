import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Heading, Notice, Text } from "@/components/ui";
import { Breadcrumbs, CenteredPageLayout } from "@/components/layout";
import { useSystemStatus } from "@/hooks";

export const HealthPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const { health, ready, isLoading } = useSystemStatus();

	return (
		<CenteredPageLayout className="max-w-5xl">
			<Breadcrumbs
				items={[
					{ href: "/", label: t("nav.home") },
					{ href: "/health", label: t("health.title") },
				]}
			/>
			<Heading tag="h1">{t("health.title")}</Heading>
			<Text>{t("health.summary")}</Text>

			{isLoading ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("health.loadingTitle")}
					noticeTitleTag="h2"
				>
					<Text>{t("health.loadingBody")}</Text>
				</Notice>
			) : null}

			{health ? (
				<Notice
					noticeRole="info"
					noticeTitle={t("health.cardTitle")}
					noticeTitleTag="h2"
				>
					<div className="flex flex-col gap-200">
						<Text>{t("health.healthStatus", { status: health.status })}</Text>
						<Text>
							{t("health.environment", { value: health.environment })}
						</Text>
						<Text>{t("health.version", { value: health.version })}</Text>
					</div>
				</Notice>
			) : null}

			{ready ? (
				<Notice
					noticeRole="success"
					noticeTitle={t("health.readyTitle")}
					noticeTitleTag="h2"
				>
					<div className="flex flex-col gap-200">
						<Text>{t("health.readyStatus", { status: ready.status })}</Text>
						<Text>
							{t("health.databaseStatus", { status: ready.database })}
						</Text>
						<Text>{t("health.redisStatus", { status: ready.redis })}</Text>
					</div>
				</Notice>
			) : null}
		</CenteredPageLayout>
	);
};
