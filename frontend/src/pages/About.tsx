import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "../common/types";
import { Card, Grid, Heading, Text } from "../components";
import { CenteredPageLayout } from "../components/layout";

const About = (): FunctionComponent => {
	const { t } = useTranslation();

	return (
		<CenteredPageLayout className="max-w-6xl gap-600">
			<div className="max-w-3xl">
				<Heading tag="h1">{t("about.title")}</Heading>
				<Text>{t("about.intro")}</Text>
			</div>

			<section>
				<Heading tag="h2">{t("about.sectionFeatureTitle")}</Heading>
				<Text>{t("about.sectionFeatureBody")}</Text>
			</section>

			<section>
				<Heading tag="h2">{t("about.sectionIntegrationTitle")}</Heading>
				<Text>{t("about.sectionIntegrationBody")}</Text>
			</section>

			<section>
				<Heading tag="h2">{t("about.sectionSupportTitle")}</Heading>
				<Text>{t("about.sectionSupportBody")}</Text>
			</section>

			<Grid columnsDesktop="1fr 1fr" columnsTablet="1fr 1fr">
				<Card
					badge="Docs"
					cardTitle={t("about.cardTitle")}
					cardTitleTag="h3"
					description={t("about.cardDescription")}
					href="/"
				/>
				<Card
					badge="Portal"
					cardTitle={t("home.title")}
					cardTitleTag="h3"
					description={t("about.summary")}
					href="/"
				/>
			</Grid>
		</CenteredPageLayout>
	);
};

export default About;
