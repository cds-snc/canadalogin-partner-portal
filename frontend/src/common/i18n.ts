import i18n, { type InitOptions } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend, { type HttpBackendOptions } from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import type translationEN from "../assets/locales/en/translations.json";
import { normalizeLanguageCode, supportedLanguages } from "./language";
import { isProduction } from "./utilities";

type TranslationMessages = typeof translationEN;

export const defaultNS = "translations";
export const resources = {
	en: { translations: {} as TranslationMessages },
	fr: { translations: {} as TranslationMessages },
} as const;

const isTest = import.meta.env.MODE === "test";
const translationLoadPath = isProduction
	? "locales/{{lng}}/translations.json"
	: "/src/assets/locales/{{lng}}/translations.json";

const loadTestResources = async (): Promise<typeof resources> => {
	const [translationEN, translationFR] = await Promise.all([
		import("../assets/locales/en/translations.json"),
		import("../assets/locales/fr/translations.json"),
	]);

	return {
		en: { translations: translationEN.default },
		fr: { translations: translationFR.default },
	} as const;
};

const testResources = isTest ? await loadTestResources() : undefined;

const i18nOptions: InitOptions<HttpBackendOptions> = {
	defaultNS,
	ns: [defaultNS],
	debug: !isProduction,
	supportedLngs: [...supportedLanguages],
	nonExplicitSupportedLngs: true,
	load: "languageOnly",
	fallbackLng: (code): Array<string> => [normalizeLanguageCode(code)],
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
	...(isTest
		? {
				resources: testResources,
			}
		: {
				backend: {
					loadPath: translationLoadPath,
				},
			}),
};

const configuredI18n = i18n.use(initReactI18next).use(LanguageDetector);

if (!isTest) {
	configuredI18n.use(Backend);
}

void configuredI18n.init<HttpBackendOptions>(i18nOptions);

export default i18n;
