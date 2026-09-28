import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Heading, Text } from "@/components/ui";

const TermsAndConditionsContent = (): ReactElement => {
	const { t } = useTranslation() as unknown as {
		t: (key: string | Array<string>) => string;
	};

	return (
		<section className="terms-and-conditions">
			<Heading tag="h1">{t("termsAndConditions.title")}</Heading>
			<Text>{t("termsAndConditions.intro")}</Text>
			<Text>{t("termsAndConditions.agreementIntro")}</Text>
			<ul className="terms-and-conditions__responsibilities">
				<li>{t("termsAndConditions.responsibility1")}</li>
				<li>{t("termsAndConditions.responsibility2")}</li>
				<li>{t("termsAndConditions.responsibility3")}</li>
				<li>{t("termsAndConditions.responsibility4")}</li>
				<li>{t("termsAndConditions.responsibility5")}</li>
				<li>{t("termsAndConditions.responsibility6")}</li>
			</ul>
		</section>
	);
};

export default TermsAndConditionsContent;
