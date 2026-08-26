import { defineConfig, devices } from "@playwright/test";
import {
	WALKTHROUGH_BASE_URL,
	WALKTHROUGH_OUTPUT_DIRECTORY,
	WALKTHROUGH_VIDEO_SIZE,
} from "./settings";

export default defineConfig({
	expect: { timeout: 15_000 },
	forbidOnly: true,
	fullyParallel: false,
	globalTimeout: 45 * 60 * 1000,
	outputDir: `${WALKTHROUGH_OUTPUT_DIRECTORY}/.playwright`,
	preserveOutput: "always",
	projects: [
		{
			name: "walkthrough-chromium",
			use: {
				...devices["Desktop Chrome"],
				viewport: WALKTHROUGH_VIDEO_SIZE,
			},
		},
	],
	reporter: [["line"]],
	retries: 0,
	testDir: ".",
	testMatch: "record.spec.ts",
	timeout: 10 * 60 * 1000,
	use: {
		baseURL: WALKTHROUGH_BASE_URL,
		colorScheme: "light",
		locale: "en-CA",
		timezoneId: "America/Toronto",
		trace: "retain-on-failure",
	},
	workers: 1,
});
