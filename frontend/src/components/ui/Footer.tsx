import React from "react";
import { useTranslation } from "react-i18next";
import { GcdsFooter } from "@gcds-core/components-react";

const FooterComponent: React.FC = () => {
	const { i18n } = useTranslation();
	const lang = i18n.language?.startsWith("fr") ? "fr" : "en";

	const subLinks =
		lang === "fr"
			? {
					"À propos de Canada.ca":
						"https://www.canada.ca/fr/gouvernement/a-propos.html",
					Avis: "https://www.canada.ca/fr/transparence/avis.html",
					Confidentialité:
						"https://www.canada.ca/fr/transparence/confidentialite.html",
				}
			: {
					"About Canada.ca": "https://www.canada.ca/en/government/about.html",
					"Terms and conditions":
						"https://www.canada.ca/en/transparency/terms.html",
					Privacy: "https://www.canada.ca/en/transparency/privacy.html",
				};

	return <GcdsFooter lang={lang} subLinks={subLinks} />;
};

const Footer = React.memo(FooterComponent);

export default Footer;
