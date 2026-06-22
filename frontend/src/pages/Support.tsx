import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "../common/types";
import { Card, Grid, Heading, Text } from "../components";
import { CenteredPageLayout } from "../components/layout";

const Support = (): FunctionComponent => {
	const { t } = useTranslation();

	return (
		<CenteredPageLayout className="max-w-6xl gap-600">
			<div className="max-w-3xl">
				<Heading tag="h1">{t("support.title")}</Heading>
				<Text>{t("support.intro")}</Text>
			</div>

			<section>
				<Heading tag="h2">{t("support.sectionGettingHelpTitle")}</Heading>
				<Text>{t("support.sectionGettingHelpBody")}</Text>
			</section>

			<section>
				<Heading tag="h2">{t("support.sectionRequestTitle")}</Heading>
				<Text>{t("support.sectionRequestBody")}</Text>
			</section>

			<Grid columnsDesktop="1fr 1fr" columnsTablet="1fr 1fr">
				<Card
					badge="Support"
					cardTitle={t("support.cardPortalTitle")}
					cardTitleTag="h3"
					description={t("support.cardPortalDescription")}
					href="https://jtickets.atlassian.net/servicedesk/customer/portal/140"
				/>
				<Card
					badge="Portal"
					cardTitle={t("home.title")}
					cardTitleTag="h3"
					description={t("support.summary")}
					href="/"
				/>
			</Grid>
		</CenteredPageLayout>
	);
};

export default Support;
