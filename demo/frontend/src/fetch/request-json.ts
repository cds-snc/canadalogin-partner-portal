export const requestJson = async <T>(
	path: string,
	init: RequestInit
): Promise<T | null> => {
	const response = await fetch(path, {
		headers: {
			"Content-Type": "application/json",
			...(init.headers ?? {}),
		},
		...init,
	});

	if (response.status === 204) {
		return null;
	}

	if (!response.ok) {
		throw new Error(`Request failed with status ${response.status}`);
	}

	const text = await response.text();
	if (!text.trim()) {
		return null;
	}

	return JSON.parse(text) as T;
};