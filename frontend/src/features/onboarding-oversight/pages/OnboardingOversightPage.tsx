import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { Card, Grid, Heading, Notice, Text } from "@/components/ui";

type Translate = (
	key: string | Array<string>,
	options?: Record<string, unknown>
) => string;

const OVERSIGHT_TASKS = [
	{
		descriptionKey: "onboardingOversight.overview.workspacesBody",
		href: "/workspaces",
		titleKey: "onboardingOversight.overview.workspacesTitle",
	},
	{
		descriptionKey: "onboardingOversight.overview.usersBody",
		href: "/users",
		titleKey: "onboardingOversight.overview.usersTitle",
	},
	{
		descriptionKey: "onboardingOversight.overview.invitationsBody",
		href: "/users/invite",
		titleKey: "onboardingOversight.overview.invitationsTitle",
	},
	{
		descriptionKey: "onboardingOversight.overview.productionReviewsBody",
		href: "/onboarding-oversight/queue",
		titleKey: "onboardingOversight.overview.productionReviewsTitle",
	},
] as const;

export const OnboardingOversightPage = (): FunctionComponent => {
	const { t } = useTranslation() as unknown as { t: Translate };

	return (
		<div className="grid gap-400">
			<div>
				<Heading tag="h1">
					{t("onboardingOversight.overview.pageTitle")}
				</Heading>
				<Text>{t("onboardingOversight.overview.summary")}</Text>
			</div>

			<Notice
				noticeRole="info"
				noticeTitle={t("onboardingOversight.overview.accessNoticeTitle")}
				noticeTitleTag="h2"
			>
				<Text>{t("onboardingOversight.overview.accessNoticeBody")}</Text>
			</Notice>

			<section className="grid gap-200">
				<Heading tag="h2">
					{t("onboardingOversight.overview.tasksTitle")}
				</Heading>
				<Grid columns="1fr" columnsTablet="1fr 1fr">
					{OVERSIGHT_TASKS.map((task) => (
						<Card
							key={task.titleKey}
							cardTitle={t(task.titleKey)}
							cardTitleTag="h3"
							description={t(task.descriptionKey)}
							href={task.href}
						/>
					))}
				</Grid>
			</section>
		</div>
	);
};
