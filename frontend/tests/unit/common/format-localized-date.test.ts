import { describe, expect, it } from "vitest";
import { formatLocalizedDate } from "@/common/format-localized-date";

describe("formatLocalizedDate", () => {
	it("formats safe date values for English and French", () => {
		expect(formatLocalizedDate("2026-09-01T12:00:00Z", "en")).toBe(
			"September 1, 2026"
		);
		expect(formatLocalizedDate("2026-09-01T12:00:00Z", "fr-CA")).toBe(
			"1 septembre 2026"
		);
	});

	it("preserves an invalid source value rather than inventing a date", () => {
		expect(formatLocalizedDate("not-a-date", "en")).toBe("not-a-date");
	});
});
