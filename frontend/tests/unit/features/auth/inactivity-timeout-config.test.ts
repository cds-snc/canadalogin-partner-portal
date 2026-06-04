import { afterEach, describe, expect, it, vi } from "vitest";
import { getInactivityTimeoutConfig } from "@/features/auth/inactivity-timeout-config";

describe("getInactivityTimeoutConfig", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("uses defaults when env values are missing", () => {
		vi.stubEnv("VITE_SESSION_WARNING_AFTER_MINUTES", "");
		vi.stubEnv("VITE_SESSION_COUNTDOWN_MINUTES", "");

		expect(getInactivityTimeoutConfig()).toMatchObject({
			countdownMinutes: 5,
			countdownMs: 5 * 60 * 1000,
			warningAfterMinutes: 25,
			warningAfterMs: 25 * 60 * 1000,
		});
	});

	it("uses configured values when valid minute strings are provided", () => {
		vi.stubEnv("VITE_SESSION_WARNING_AFTER_MINUTES", "12");
		vi.stubEnv("VITE_SESSION_COUNTDOWN_MINUTES", "3");

		expect(getInactivityTimeoutConfig()).toMatchObject({
			countdownMinutes: 3,
			countdownMs: 3 * 60 * 1000,
			warningAfterMinutes: 12,
			warningAfterMs: 12 * 60 * 1000,
		});
	});

	it("falls back to defaults when configured values are invalid", () => {
		vi.stubEnv("VITE_SESSION_WARNING_AFTER_MINUTES", "0");
		vi.stubEnv("VITE_SESSION_COUNTDOWN_MINUTES", "not-a-number");

		expect(getInactivityTimeoutConfig()).toMatchObject({
			countdownMinutes: 5,
			countdownMs: 5 * 60 * 1000,
			warningAfterMinutes: 25,
			warningAfterMs: 25 * 60 * 1000,
		});
	});
});
