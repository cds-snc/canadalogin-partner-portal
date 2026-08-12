import { describe, expect, it } from "vitest";
import translationsEn from "@/assets/locales/en/translations.json";
import translationsFr from "@/assets/locales/fr/translations.json";

describe("local persona translations", () => {
	it("keeps English and French selector keys in parity", () => {
		expect(Object.keys(translationsFr.localDevPersona).sort()).toEqual(
			Object.keys(translationsEn.localDevPersona).sort()
		);
		expect(
			Object.values(translationsEn.localDevPersona).every(
				(value) => value.trim().length > 0
			)
		).toBe(true);
		expect(
			Object.values(translationsFr.localDevPersona).every(
				(value) => value.trim().length > 0
			)
		).toBe(true);
	});
});
