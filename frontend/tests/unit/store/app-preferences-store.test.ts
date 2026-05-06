import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/common/i18n", () => ({
	default: {
		changeLanguage: vi.fn((): Promise<void> => Promise.resolve()),
		language: "en",
		resolvedLanguage: "en",
	},
}));

describe("appPreferencesStore", () => {
	beforeEach(async () => {
		localStorage.clear();
		const { resetAppPreferencesStore } = await import("@/store");

		await resetAppPreferencesStore();
	});

	afterEach(async () => {
		const { resetAppPreferencesStore } = await import("@/store");

		await resetAppPreferencesStore();
		vi.clearAllMocks();
		localStorage.clear();
	});

	it("changes the stored language and syncs i18n", async () => {
		const [{ appPreferencesStore }, { default: i18n }] = await Promise.all([
			import("@/store"),
			import("@/common/i18n"),
		]);

		await appPreferencesStore.getState().setLanguage("fr");

		expect(appPreferencesStore.getState().language).toBe("fr");
		expect(i18n.changeLanguage).toHaveBeenCalledWith("fr");
	});

	it("toggles between English and French", async () => {
		const [{ appPreferencesStore }, { default: i18n }] = await Promise.all([
			import("@/store"),
			import("@/common/i18n"),
		]);

		await appPreferencesStore.getState().toggleLanguage();
		expect(appPreferencesStore.getState().language).toBe("fr");

		await appPreferencesStore.getState().toggleLanguage();
		expect(appPreferencesStore.getState().language).toBe("en");
		expect(i18n.changeLanguage).toHaveBeenLastCalledWith("en");
	});
});