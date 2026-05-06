export const releaseActiveElementFocus = (): void => {
	if (typeof document === "undefined") {
		return;
	}

	const activeElement = document.activeElement;

	if (
		!(activeElement instanceof HTMLElement) ||
		activeElement === document.body
	) {
		return;
	}

	activeElement.blur();
};
