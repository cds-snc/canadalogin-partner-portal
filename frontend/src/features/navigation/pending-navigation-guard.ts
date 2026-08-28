type PendingNavigationGuard = () => boolean;

let activeGuard: PendingNavigationGuard | null = null;
let navigationAllowance: symbol | null = null;

export const registerPendingNavigationGuard = (
	guard: PendingNavigationGuard
): (() => void) => {
	activeGuard = guard;
	return (): void => {
		if (activeGuard === guard) activeGuard = null;
	};
};

export const confirmPendingNavigation = (): boolean => activeGuard?.() ?? true;

export const allowNextPendingNavigation = (): (() => void) => {
	const allowance = Symbol("pending-navigation-allowance");
	navigationAllowance = allowance;
	return (): void => {
		if (navigationAllowance === allowance) navigationAllowance = null;
	};
};

export const consumePendingNavigationAllowance = (): boolean => {
	if (navigationAllowance === null) return false;
	navigationAllowance = null;
	return true;
};
