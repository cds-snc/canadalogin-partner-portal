import React from "react";
import { GcdsLangToggle } from "@gcds-core/components-react";

interface LangToggleProps {
	lang: "en" | "fr";
	href: string;
}

const LangToggle: React.FC<LangToggleProps> = React.memo(
	({ lang, href }) => <GcdsLangToggle href={href} lang={lang} />
);

export default LangToggle;
