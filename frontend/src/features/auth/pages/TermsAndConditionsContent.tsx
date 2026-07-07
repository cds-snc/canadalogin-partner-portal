import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Heading, Text } from "@/components/ui";

const TermsAndConditionsContent = (): ReactElement => {
	const { t } = useTranslation() as unknown as {
		t: (key: string | Array<string>) => string;
	};

	return (
		<>
			<Heading tag="h1">{t("termsAndConditions.title")}</Heading>
			<Text>{t("termsAndConditions.intro")}</Text>
			<Heading tag="h2">{t("termsAndConditions.section1Title")}</Heading>
			<Text>{t("termsAndConditions.section1Body")}</Text>
			<Heading tag="h2">{t("termsAndConditions.section2Title")}</Heading>
			<Text>{t("termsAndConditions.section2Body")}</Text>
			<Heading tag="h2">{t("termsAndConditions.section3Title")}</Heading>
			<Text>{t("termsAndConditions.section3Body")}</Text>
		</>
	);
};

export default TermsAndConditionsContent;
