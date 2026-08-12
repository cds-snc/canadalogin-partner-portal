import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserRead } from "@/fetch/auth";
import { useAuthStore } from "@/store";
import {
	currentUserQueryKey,
	fetchCurrentUserProjection,
} from "@/features/auth/session-queries";

export type SessionState = {
	currentUser: UserRead | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (redirect?: string) => void;
	logout: () => Promise<void>;
	refreshSession: () => Promise<UserRead | null>;
};

export const useSession = (): SessionState => {
	const currentUser = useAuthStore((state) => state.currentUser);
	const hasHydrated = useAuthStore((state) => state.hasHydrated);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const isStoreLoading = useAuthStore((state) => state.isLoading);
	const login = useAuthStore((state) => state.login);
	const logoutProjection = useAuthStore((state) => state.logout);
	const queryClient = useQueryClient();
	const sessionQuery = useQuery({
		enabled: !hasHydrated,
		queryFn: fetchCurrentUserProjection,
		queryKey: currentUserQueryKey,
		retry: false,
		staleTime: 30_000,
	});

	const refreshSession = useCallback(
		async (): Promise<UserRead | null> =>
			queryClient.fetchQuery({
				queryFn: fetchCurrentUserProjection,
				queryKey: currentUserQueryKey,
				staleTime: 0,
			}),
		[queryClient]
	);

	const logout = useCallback(async (): Promise<void> => {
		await queryClient.cancelQueries({ queryKey: currentUserQueryKey });
		await logoutProjection();
		queryClient.removeQueries({ queryKey: currentUserQueryKey });
	}, [logoutProjection, queryClient]);

	return {
		currentUser,
		isAuthenticated,
		isLoading: isStoreLoading || sessionQuery.isFetching,
		login,
		logout,
		refreshSession,
	};
};
