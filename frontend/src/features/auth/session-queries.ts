import { authStore } from "@/store";
import type { UserRead } from "@/fetch/auth";
import { appQueryClient } from "@/lib/query-client";

export const currentUserQueryKey = ["auth", "current-user"] as const;

export const fetchCurrentUserProjection = async (): Promise<UserRead | null> =>
	authStore.getState().refreshSession();

export const revalidateCurrentUser = async (): Promise<UserRead | null> =>
	appQueryClient.fetchQuery({
		queryFn: fetchCurrentUserProjection,
		queryKey: currentUserQueryKey,
		staleTime: 0,
	});
