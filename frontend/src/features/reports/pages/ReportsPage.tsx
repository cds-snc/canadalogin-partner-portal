import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useDocumentTitle } from "@/common/use-document-title";
import { Card, Grid, Heading, Text } from "@/components/ui";
import { hasCapability, type Capability } from "@/features/auth/authorization";
import { useSession } from "@/hooks";

const REPORT_GROUPS = [
	{
		id: "platformReporting",
		reports: [
			{
				capability: "onboarding_oversight_read",
				descriptionKey: "reports.cards.onboarding.description",
				href: "/onboarding-oversight/reports",
				id: "onboarding",
				titleKey: "reports.cards.onboarding.title",
			},
		],
		summaryKey: "reports.groups.platformReporting.summary",
		titleKey: "reports.groups.platformReporting.title",
	},
	{
		id: "partnerReporting",
		reports: [
			{
				capability: "aggregate_report_read",
				descriptionKey: "reports.cards.workspaces.description",
				href: "/reports/workspaces",
				id: "workspaces",
				titleKey: "reports.cards.workspaces.title",
			},
			{
				capability: "mau_report_read",
				descriptionKey: "reports.cards.applications.description",
				href: "/reports/applications",
				id: "applications",
				titleKey: "reports.cards.applications.title",
			},
		],
		summaryKey: "reports.groups.partnerReporting.summary",
		titleKey: "reports.groups.partnerReporting.title",
	},
] as const satisfies ReadonlyArray<{
	id: string;
	reports: ReadonlyArray<{
		capability: Capability;
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
	const { currentUser } = useSession();
	const authorizationContext = currentUser?.authorizationContext;
	useDocumentTitle(t("reports.title"), t("home.title"));

	return (
		<div className="grid gap-500">
			<div>
				<Heading tag="h1">{t("reports.title")}</Heading>
				<Text>{t("reports.summary")}</Text>
			</div>
			{REPORT_GROUPS.map((group) => {
				const availableReports = group.reports.filter((report) =>
					hasCapability(authorizationContext, report.capability)
				);
				if (availableReports.length === 0) return null;

				return (
					<section key={group.id}>
						<Heading tag="h2">{t(group.titleKey)}</Heading>
						<Text>{t(group.summaryKey)}</Text>
						<Grid columns="1fr" columnsTablet="1fr 1fr" tag="div">
							{availableReports.map((report) => (
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
