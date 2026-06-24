import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { clearBackendActivity } from "@/lib/backend-activity";
import { getCurrentUser, getOidcLoginUrl, type UserRead } from "@/fetch/auth";

type AuthStoreState = {
	currentUser: UserRead | null;
	hasHydrated: boolean;
	isAuthenticated: boolean;
	isLoading: boolean;
	hydrateSession: () => Promise<UserRead | null>;
	login: () => void;
	logout: () => Promise<void>;
	refreshSession: () => Promise<UserRead | null>;
	reset: () => void;
};

type SessionSnapshot = Pick<
	AuthStoreState,
	"currentUser" | "hasHydrated" | "isAuthenticated" | "isLoading"
>;

const initialSnapshot: SessionSnapshot = {
	currentUser: null,
	hasHydrated: false,
	isAuthenticated: false,
	isLoading: false,
};

let inFlightHydration: Promise<UserRead | null> | null = null;
let sessionVersion = 0;

const createSessionSnapshot = (
	currentUser: UserRead | null
): SessionSnapshot => ({
	currentUser,
	hasHydrated: true,
	isAuthenticated: currentUser !== null,
	isLoading: false,
});

const authStore = createStore<AuthStoreState>()((set, get) => {
	const runHydration = (forceRefresh = false): Promise<UserRead | null> => {
		if (!forceRefresh) {
			const state = get();

			if (state.hasHydrated) {
				return Promise.resolve(state.currentUser);
			}

			if (inFlightHydration) {
				return inFlightHydration;
			}
		}

		const requestVersion = ++sessionVersion;
		set((state) => ({ ...state, isLoading: true }));

		const hydrationPromise = getCurrentUser()
			.then((currentUser) => {
				if (requestVersion === sessionVersion) {
					set((state) => ({ ...state, ...createSessionSnapshot(currentUser) }));
				}

				return requestVersion === sessionVersion
					? currentUser
					: get().currentUser;
			})
			.catch((error: unknown) => {
				if (requestVersion === sessionVersion) {
					set((state) => ({ ...state, ...createSessionSnapshot(null) }));
				}

				throw error;
			})
			.finally(() => {
				if (inFlightHydration === hydrationPromise) {
					inFlightHydration = null;
				}
			});

		inFlightHydration = hydrationPromise;

		return hydrationPromise;
	};

	return {
		...initialSnapshot,
		hydrateSession: (): Promise<UserRead | null> => runHydration(false),
		login: (): void => {
			window.location.assign(getOidcLoginUrl());
		},
		logout: (): Promise<void> => {
			sessionVersion += 1;
			inFlightHydration = null;
			clearBackendActivity();
			set((state) => ({ ...state, ...createSessionSnapshot(null) }));
			window.location.href = "/api/v1/logout";
			return Promise.resolve();
		},
		refreshSession: (): Promise<UserRead | null> => runHydration(true),
		reset: (): void => {
			sessionVersion += 1;
			inFlightHydration = null;
			clearBackendActivity();
			set((state) => ({ ...state, ...initialSnapshot }));
		},
	};
});

const useAuthStore = <Selected>(
	selector: (state: AuthStoreState) => Selected
): Selected => useStore(authStore, selector);

const resetAuthStore = (): void => {
	authStore.getState().reset();
};

export { authStore, resetAuthStore, useAuthStore };
export type { AuthStoreState };
