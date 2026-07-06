import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "../common/types";
import { Button, Heading, Link, Text } from "../components";

const Support = (): FunctionComponent => {
	const { t } = useTranslation();

	return (
		<>
			<div className="max-w-3xl">
				<Heading tag="h1">{t("support.title")}</Heading>
				<Text>{t("support.intro")}</Text>
			</div>

			<section>
				<Heading tag="h2">{t("support.sectionTroubleshootingTitle")}</Heading>
				<Text marginBottom="100"><strong>{t("support.sectionTroubleshootingItem1Title")}</strong></Text>
				<Text>{t("support.sectionTroubleshootingItem1Body")}</Text>
				<Text marginBottom="100"><strong>{t("support.sectionTroubleshootingItem2Title")}</strong></Text>
				<Text>{t("support.sectionTroubleshootingItem2Body")}</Text>
			</section>

			<section>
				<Heading tag="h2">{t("support.sectionRequestTitle")}</Heading>
				<Text>{t("support.sectionRequestBody")}</Text>
				<Button
					buttonRole="primary"
					href="https://jtickets.atlassian.net/servicedesk/customer/portal/140"
					type="link"
				>
					{t("support.submitTicketButton")}
				</Button>
				<div className="mt-300">
					<Link href="mailto:CDS.PartnerSuccessOperations-OperationsSuccesPartenaires.SNC@servicecanada.gc.ca">
						{t("support.requestAtlassianAccount")}
					</Link>
				</div>
			</section>
		</>
	);
};

export default Support;
