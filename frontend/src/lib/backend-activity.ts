type BackendActivityListener = () => void;

let lastBackendActivityAt: number | null = null;
const listeners = new Set<BackendActivityListener>();

const notifyListeners = (): void => {
	for (const listener of listeners) {
		listener();
	}
};

export const getLastBackendActivityAt = (): number | null =>
	lastBackendActivityAt;

export const markBackendActivity = (timestamp = Date.now()): void => {
	lastBackendActivityAt = timestamp;
	notifyListeners();
};

export const clearBackendActivity = (): void => {
	lastBackendActivityAt = null;
	notifyListeners();
};

export const subscribeToBackendActivity = (
	listener: BackendActivityListener
): (() => void) => {
	listeners.add(listener);

	return (): void => {
		listeners.delete(listener);
	};
};
