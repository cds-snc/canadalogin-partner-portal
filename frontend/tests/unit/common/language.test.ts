import { describe, expect, it } from "vitest";
import { normalizeLanguageCode } from "@/common/language";

describe("normalizeLanguageCode", () => {
	it("maps English variants to en", () => {
		expect(normalizeLanguageCode("en")).toBe("en");
		expect(normalizeLanguageCode("en-US")).toBe("en");
		expect(normalizeLanguageCode("en-CA")).toBe("en");
	});

	it("maps French variants to fr", () => {
		expect(normalizeLanguageCode("fr")).toBe("fr");
		expect(normalizeLanguageCode("fr-CA")).toBe("fr");
		expect(normalizeLanguageCode("fr-FR")).toBe("fr");
	});

	it("falls back to en for unsupported or missing values", () => {
		expect(normalizeLanguageCode("es")).toBe("en");
		expect(normalizeLanguageCode("pt-BR")).toBe("en");
		expect(normalizeLanguageCode(undefined)).toBe("en");
		expect(normalizeLanguageCode(null)).toBe("en");
	});
});