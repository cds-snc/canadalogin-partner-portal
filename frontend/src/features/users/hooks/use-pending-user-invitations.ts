import { useQuery } from "@tanstack/react-query";
import {
	getPendingUserInvitations,
	type PendingUserInvitationsListResponse,
} from "@/fetch/users";

export const pendingUserInvitationsQueryKey = (
	page: number,
	itemsPerPage: number
) => ["user-pending-invitations", page, itemsPerPage] as const;

export type PendingUserInvitationsState = {
	error: Error | null;
	invitations: PendingUserInvitationsListResponse["data"];
	isLoading: boolean;
	response: PendingUserInvitationsListResponse | null;
};

export const usePendingUserInvitations = (
	page = 1,
	itemsPerPage = 10
): PendingUserInvitationsState => {
	const query = useQuery<PendingUserInvitationsListResponse, Error>({
		queryFn: () => getPendingUserInvitations(page, itemsPerPage),
		queryKey: pendingUserInvitationsQueryKey(page, itemsPerPage),
	});

	return {
		error: query.error ?? null,
		invitations: query.data?.data ?? [],
		isLoading: query.isLoading,
		response: query.data ?? null,
	};
};
