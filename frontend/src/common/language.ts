export const supportedLanguages = ["en", "fr"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const normalizeLanguageCode = (
	language?: string | null
): SupportedLanguage => {
	const normalizedLanguage = language?.trim().toLowerCase();

	if (normalizedLanguage?.startsWith("fr")) {
		return "fr";
	}

	return "en";
};
