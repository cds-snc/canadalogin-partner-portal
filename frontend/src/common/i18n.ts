import i18n, { type InitOptions } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import translationENMessages from "../assets/locales/en/translations.json";
import translationFRMessages from "../assets/locales/fr/translations.json";
import { normalizeLanguageCode, supportedLanguages } from "./language";

export const defaultNS = "translations";
export const resources = {
	en: { translations: translationENMessages },
	fr: { translations: translationFRMessages },
} as const;

const i18nOptions: InitOptions = {
	defaultNS,
	ns: [defaultNS],
	debug: import.meta.env.MODE !== "production",
	supportedLngs: [...supportedLanguages],
	nonExplicitSupportedLngs: true,
	load: "languageOnly",
	fallbackLng: (code): Array<string> => [normalizeLanguageCode(code)],
	resources,
	detection: {
		order: [
			"querystring",
			"localStorage",
			"sessionStorage",
			"navigator",
			"htmlTag",
		],
		lookupQuerystring: "lng",
		caches: ["localStorage"],
		convertDetectedLanguage: (language: string): string =>
			normalizeLanguageCode(language),
	},
	interpolation: {
		escapeValue: false, // not needed for react as it escapes by default
	},
};

const configuredI18n = i18n.use(initReactI18next).use(LanguageDetector);

void configuredI18n.init(i18nOptions);

export default i18n;
