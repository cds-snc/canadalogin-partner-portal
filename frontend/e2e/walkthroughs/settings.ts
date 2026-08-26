import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const frontendDirectory = resolve(
	dirname(fileURLToPath(import.meta.url)),
	"../.."
);

const parsePageHoldMilliseconds = (): number => {
	const configuredValue = process.env["WALKTHROUGH_HOLD_MS"];
	if (configuredValue === undefined) {
		return 6000;
	}

	const pageHoldMilliseconds = Number(configuredValue);
	if (
		!Number.isInteger(pageHoldMilliseconds) ||
		pageHoldMilliseconds < 0 ||
		pageHoldMilliseconds > 60_000
	) {
		throw new Error(
			"WALKTHROUGH_HOLD_MS must be an integer between 0 and 60000."
		);
	}

	return pageHoldMilliseconds;
};

const parseBaseUrl = (): string => {
	const configuredValue =
		process.env["WALKTHROUGH_BASE_URL"] ?? "http://127.0.0.1:3000";
	const url = new URL(configuredValue);
	const loopbackHosts = new Set(["127.0.0.1", "::1", "[::1]", "localhost"]);

	if (
		url.protocol !== "http:" ||
		!loopbackHosts.has(url.hostname) ||
		url.username !== "" ||
		url.password !== "" ||
		url.pathname !== "/" ||
		url.search !== "" ||
		url.hash !== ""
	) {
		throw new Error(
			"WALKTHROUGH_BASE_URL must be an HTTP loopback origin without credentials, a path, a query, or a fragment."
		);
	}

	return url.origin;
};

const parseOutputDirectory = (): string => {
	const configuredValue =
		process.env["WALKTHROUGH_OUTPUT_DIR"] ?? "walkthrough-recordings";
	return isAbsolute(configuredValue)
		? configuredValue
		: resolve(frontendDirectory, configuredValue);
};

export const WALKTHROUGH_BASE_URL = parseBaseUrl();
export const WALKTHROUGH_OUTPUT_DIRECTORY = parseOutputDirectory();
export const WALKTHROUGH_PAGE_HOLD_MS = parsePageHoldMilliseconds();
export const WALKTHROUGH_VIDEO_SIZE = { height: 900, width: 1440 } as const;
