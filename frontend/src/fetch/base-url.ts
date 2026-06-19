const defaultApiBaseUrl = "http://localhost:8000";
const isTestMode = import.meta.env.MODE === "test";

const isLocalDevelopmentHostname = (
	hostname: string | null | undefined
): boolean => hostname === "localhost" || hostname === "127.0.0.1";

const getDefaultApiBaseUrl = (): string => {
	const location = globalThis.location;

	if (!location) {
		return defaultApiBaseUrl;
	}

	const hostname = location.hostname?.trim();

	if (isLocalDevelopmentHostname(hostname)) {
		return isTestMode
			? `${location.protocol}//${hostname}:8000`
			: location.origin || defaultApiBaseUrl;
	}

	return location.origin || defaultApiBaseUrl;
};

const normalizeLocalConfiguredBaseUrl = (configuredBaseUrl: string): string => {
	const location = globalThis.location;

	if (!location || !isLocalDevelopmentHostname(location.hostname?.trim())) {
		return configuredBaseUrl;
	}

	try {
		const configuredUrl = new URL(configuredBaseUrl);

		if (!isLocalDevelopmentHostname(configuredUrl.hostname)) {
			return configuredBaseUrl;
		}

		configuredUrl.hostname = location.hostname.trim();

		return configuredUrl.toString().replace(/\/$/, "");
	} catch {
		return configuredBaseUrl;
	}
};

export const getApiBaseUrl = (): string => {
	const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

	return configuredBaseUrl && configuredBaseUrl.length > 0
		? normalizeLocalConfiguredBaseUrl(configuredBaseUrl)
		: getDefaultApiBaseUrl();
};

export const buildApiUrl = (path: string): string =>
	new URL(path, getApiBaseUrl()).toString();
