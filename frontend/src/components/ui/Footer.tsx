import React from "react";
import { useTranslation } from "react-i18next";
import { GcdsFooter } from "@gcds-core/components-react";

const FooterComponent: React.FC = () => {
	const { i18n, t } = useTranslation();
	const lang = i18n.language?.startsWith("fr") ? "fr" : "en";

	const contextualLinks = {
		[t("footer.apiDocumentation")]: "#",
		[t("footer.support")]: "/support",
		[t("footer.systemStatus")]: "#",
	};

	const subLinks = {
		[t("footer.terms")]: "/terms-and-conditions",
		[t("footer.privacy")]:
			lang === "fr"
				? "https://www.canada.ca/fr/transparence/confidentialite.html"
				: "https://www.canada.ca/en/transparency/privacy.html",
	};

	return (
		<GcdsFooter
			contextualHeading={t("footer.contextualHeading")}
			contextualLinks={contextualLinks}
			display="compact"
			lang={lang}
			subLinks={subLinks}
		/>
	);
};

const Footer = React.memo(FooterComponent);

export default Footer;
