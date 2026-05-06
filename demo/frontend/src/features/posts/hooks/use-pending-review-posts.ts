import { useQuery } from "@tanstack/react-query";
import { getPendingReviewPosts, type PostsListResponse } from "@/fetch/posts";

export const pendingReviewPostsQueryKey = (page: number, itemsPerPage: number) =>
	["pending-review-posts", page, itemsPerPage] as const;

export type PendingReviewPostsState = {
	error: Error | null;
	isLoading: boolean;
	itemsPerPage: number;
	page: number;
	posts: PostsListResponse["data"];
	refetch: () => Promise<unknown>;
	response: PostsListResponse | null;
};

export const usePendingReviewPosts = (
	page = 1,
	itemsPerPage = 10,
): PendingReviewPostsState => {
	const query = useQuery<PostsListResponse, Error>({
		queryFn: () => getPendingReviewPosts(page, itemsPerPage),
		queryKey: pendingReviewPostsQueryKey(page, itemsPerPage),
		retry: false,
	});

	return {
		error: query.error ?? null,
		isLoading: query.isLoading,
		itemsPerPage,
		page,
		posts: query.data?.data ?? [],
		refetch: () => query.refetch(),
		response: query.data ?? null,
	};
};