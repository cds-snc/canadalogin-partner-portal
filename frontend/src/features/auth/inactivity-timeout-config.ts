const DEFAULT_WARNING_MINUTES = 25;
const DEFAULT_COUNTDOWN_MINUTES = 5;

const parseDurationMinutes = (
	value: string | undefined,
	fallbackMinutes: number
): number => {
	if (typeof value !== "string") {
		return fallbackMinutes;
	}

	const parsed = Number(value.trim());

	if (!Number.isFinite(parsed) || parsed <= 0) {
		return fallbackMinutes;
	}

	return parsed;
};

const minutesToMilliseconds = (minutes: number): number =>
	Math.round(minutes * 60 * 1000);

export type InactivityTimeoutConfig = {
	countdownMinutes: number;
	countdownMs: number;
	warningAfterMinutes: number;
	warningAfterMs: number;
};

export const getInactivityTimeoutConfig = (): InactivityTimeoutConfig => {
	const warningAfterMinutes = parseDurationMinutes(
		import.meta.env.VITE_SESSION_WARNING_AFTER_MINUTES,
		DEFAULT_WARNING_MINUTES
	);
	const countdownMinutes = parseDurationMinutes(
		import.meta.env.VITE_SESSION_COUNTDOWN_MINUTES,
		DEFAULT_COUNTDOWN_MINUTES
	);

	return {
		countdownMinutes,
		countdownMs: minutesToMilliseconds(countdownMinutes),
		warningAfterMinutes,
		warningAfterMs: minutesToMilliseconds(warningAfterMinutes),
	};
};

export const inactivityTimeoutConfig = getInactivityTimeoutConfig();
