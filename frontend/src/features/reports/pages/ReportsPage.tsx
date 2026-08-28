import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { Card, Grid, Heading, Text } from "@/components/ui";

const REPORT_GROUPS = [
	{
		id: "applicationUsage",
		reports: [
			{
				descriptionKey: "reports.cards.applications.description",
				href: "/reports/applications",
				id: "applications",
				titleKey: "reports.cards.applications.title",
			},
		],
		summaryKey: "reports.groups.applicationUsage.summary",
		titleKey: "reports.groups.applicationUsage.title",
	},
] as const satisfies ReadonlyArray<{
	id: string;
	reports: ReadonlyArray<{
		descriptionKey: string;
		href: string;
		id: string;
		titleKey: string;
	}>;
	summaryKey: string;
	titleKey: string;
}>;

export const ReportsPage = (): FunctionComponent => {
	const { t } = useTranslation();
	useDocumentTitle(t("reports.title"), t("home.title"));

	return (
		<div className="grid gap-500">
			<div>
				<Heading tag="h1">{t("reports.title")}</Heading>
				<Text>{t("reports.summary")}</Text>
			</div>
			{REPORT_GROUPS.map((group) => {
				return (
					<section key={group.id}>
						<Heading tag="h2">{t(group.titleKey)}</Heading>
						<Text>{t(group.summaryKey)}</Text>
						<Grid columns="1fr" columnsTablet="1fr 1fr" tag="div">
							{group.reports.map((report) => (
								<Card
									key={report.id}
									cardTitle={t(report.titleKey)}
									cardTitleTag="h3"
									description={t(report.descriptionKey)}
									href={report.href}
								/>
							))}
						</Grid>
					</section>
				);
			})}
		</div>
	);
};
