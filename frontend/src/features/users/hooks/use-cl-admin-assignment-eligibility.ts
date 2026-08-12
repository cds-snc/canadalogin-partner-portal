import { useQuery } from "@tanstack/react-query";
import {
	getClAdminAssignmentEligibility,
	type ClAdminAssignmentEligibilityRead,
} from "@/fetch/role-assignments";

export const clAdminAssignmentEligibilityQueryKeyPrefix = [
	"cl-admin-assignment-eligibility",
] as const;

export const clAdminAssignmentEligibilityQueryKey = (userUuid: string) =>
	[...clAdminAssignmentEligibilityQueryKeyPrefix, userUuid] as const;

export type ClAdminAssignmentEligibilityState = {
	eligibility: ClAdminAssignmentEligibilityRead | null;
	error: Error | null;
	isLoading: boolean;
};

export const useClAdminAssignmentEligibility = (
	userUuid: string | null
): ClAdminAssignmentEligibilityState => {
	const query = useQuery<ClAdminAssignmentEligibilityRead, Error>({
		enabled: userUuid !== null,
		queryFn: () => getClAdminAssignmentEligibility(userUuid ?? ""),
		queryKey: clAdminAssignmentEligibilityQueryKey(userUuid ?? ""),
	});

	return {
		eligibility: query.data ?? null,
		error: query.error ?? null,
		isLoading: userUuid !== null && query.isLoading,
	};
};
