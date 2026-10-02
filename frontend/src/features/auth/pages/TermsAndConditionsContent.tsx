import type { ReactElement } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Heading, Link, Text } from "@/components/ui";

const TERMS_OF_USE_URL = "https://login.canada.ca/en/partners/terms-of-use/";

const TermsAndConditionsContent = (): ReactElement => {
	const { t } = useTranslation() as unknown as {
		t: (key: string | Array<string>) => string;
	};

	return (
		<section className="terms-and-conditions">
			<Heading tag="h1">{t("termsAndConditions.title")}</Heading>
			<Text>
				<Trans
					i18nKey="termsAndConditions.intro"
					components={{
						termsLink: (
							<Link external href={TERMS_OF_USE_URL}>
								{t("terms")}
							</Link>
						),
					}}
				/>
			</Text>
			<Text marginBottom="0">
				<Trans
					components={{ acceptAction: <strong /> }}
					i18nKey="termsAndConditions.agreementIntro"
				/>
			</Text>
			<ul className="list-disc mt-0 mb-300 pl-400">
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
