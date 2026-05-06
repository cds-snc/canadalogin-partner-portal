import { useQuery } from "@tanstack/react-query";
import { getUserTier, type UserTierRead } from "@/fetch/access";

export type UserTierState = {
	error: Error | null;
	isLoading: boolean;
	tier: UserTierRead | null;
};

export const userTierQueryKey = (userUuid: string) =>
	["user-tier", userUuid] as const;

export const useUserTier = (userUuid: string | null | undefined): UserTierState => {
	const query = useQuery<UserTierRead | null, Error>({
		enabled: Boolean(userUuid),
		queryFn: () => getUserTier(userUuid as string),
		queryKey: userTierQueryKey(userUuid ?? "anonymous"),
	});

	return {
		error: query.error ?? null,
		isLoading: query.isLoading,
		tier: query.data ?? null,
	};
};