import { Trans, useTranslation } from "react-i18next";
import type { FunctionComponent } from "../common/types";
import { Button, Container, Heading, Link, Text } from "../components";

const Support = (): FunctionComponent => {
	const { t } = useTranslation();
	const ticketUrl = "https://jtickets.atlassian.net/servicedesk/customer/portal/140";

	return (
		<Container alignment="start" id="account-not-found-content" size="md">
				<Heading tag="h1">{t("support.title")}</Heading>
				<Text>{t("support.intro")}</Text>

				<section>
					<Heading tag="h2">{t("support.sectionTroubleshootingTitle")}</Heading>
					<Text>{t("support.sectionTroubleshootingIntro")}</Text>

					<Heading tag="h3">
						{t("support.sectionTroubleshootingItem1Title")}
					</Heading>
					<Text>{t("support.sectionTroubleshootingItem1Body")}</Text>
					<Text>
						{t("support.sectionTroubleshootingItem1Followup")}
					</Text>

					<Heading tag="h3">
						{t("support.sectionTroubleshootingItem2Title")}
					</Heading>
					<Text>
						<Trans
							components={{ ticketLink: <Link href={ticketUrl}>{" "}</Link> }}
							i18nKey="support.sectionTroubleshootingItem2Body"
						/>
					</Text>
				</section>

				<section>
					<Heading tag="h2">{t("support.sectionRequestTitle")}</Heading>
					<Text>{t("support.sectionRequestBody")}</Text>
					<Button buttonRole="primary" href={ticketUrl} type="link">
						{t("support.submitTicketButton")}
					</Button>
					<Text marginTop="300">
						{t("support.sectionRequestFollowup")}
					</Text>
					<Heading tag="h3">
						{t("support.requestAtlassianAccountTitle")}
					</Heading>
					<Text>
						{t("support.requestAtlassianAccount")}
					</Text>
				</section>
		</Container>
	);
};

export default Support;
