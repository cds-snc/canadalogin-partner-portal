import { GcdsSignature } from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "@/common/types";
import { useAppPreferencesState } from "@/hooks";
import AppNavigation from "./AppNavigation";

const Header = (): FunctionComponent => {
	const { t } = useTranslation();
	const { language, toggleLanguage } = useAppPreferencesState();
	const serviceName =
		import.meta.env.VITE_APP_TITLE?.trim() ||
		"Digital service delivery starter";
	const nextLanguageLabel =
		language === "en"
			? t("header.switchLanguageFrench")
			: t("header.switchLanguageEnglish");

	return (
		<header className="border-b border-[var(--gcds-border-default)] bg-[var(--gcds-bg-white)]">
			<div className="mx-auto flex w-full max-w-[72rem] items-start justify-between gap-300 px-400 py-350 md:px-600 md:py-400">
				<a aria-label="Government of Canada" className="shrink-0" href="/">
					<GcdsSignature hasLink={false} lang={language} type="signature" />
				</a>
				<button
					className="pt-100 text-sm text-[var(--gcds-text-primary)] underline underline-offset-[0.16em]"
					type="button"
					onClick={() => {
						void toggleLanguage();
					}}
				>
					{nextLanguageLabel}
				</button>
			</div>
			<div className="border-t border-[var(--gcds-border-default)] bg-[var(--gcds-bg-light)]">
				<div className="mx-auto w-full max-w-[72rem] px-400 py-150 text-sm font-semibold text-[var(--gcds-text-primary)] md:px-600">
					{serviceName}
				</div>
			</div>
			<AppNavigation />
		</header>
	);
};

export default Header;
