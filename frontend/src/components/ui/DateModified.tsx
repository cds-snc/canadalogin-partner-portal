import React from "react";
import { useTranslation } from "react-i18next";
import { GcdsDateModified } from "@gcds-core/components-react";

interface DateProps {
	children: React.ReactNode;
}

const DateModifiedComponent: React.FC<DateProps> = ({ children }) => {
	const { i18n } = useTranslation();
	const lang = i18n.language?.startsWith("fr") ? "fr" : "en";

	return <GcdsDateModified lang={lang}>{children}</GcdsDateModified>;
};

const DateModified = React.memo(DateModifiedComponent);

export default DateModified;
