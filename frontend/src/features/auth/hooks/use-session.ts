import { useEffect } from "react";
import type { UserRead } from "@/fetch/auth";
import { useAuthStore } from "@/store";

export type SessionState = {
	currentUser: UserRead | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: () => void;
	logout: () => Promise<void>;
	refreshSession: () => Promise<UserRead | null>;
};

export const useSession = (): SessionState => {
	const currentUser = useAuthStore((state) => state.currentUser);
	const hasHydrated = useAuthStore((state) => state.hasHydrated);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const isLoading = useAuthStore((state) => state.isLoading);
	const hydrateSession = useAuthStore((state) => state.hydrateSession);
	const login = useAuthStore((state) => state.login);
	const logout = useAuthStore((state) => state.logout);
	const refreshSession = useAuthStore((state) => state.refreshSession);

	useEffect(() => {
		if (hasHydrated || isLoading) {
			return;
		}

		void hydrateSession();
	}, [hasHydrated, hydrateSession, isLoading]);

	return {
		currentUser,
		isAuthenticated,
		isLoading,
		login,
		logout,
		refreshSession,
	};
};
