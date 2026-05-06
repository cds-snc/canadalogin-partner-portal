import { useQuery } from "@tanstack/react-query";
import { getUserPosts, type PostsListResponse } from "@/fetch/posts";

export const postsQueryKey = (userUuid: string | null | undefined, page: number, itemsPerPage: number) =>
	["posts", userUuid ?? "anonymous", page, itemsPerPage] as const;

export type PostsState = {
	error: Error | null;
	isLoading: boolean;
	itemsPerPage: number;
	page: number;
	posts: PostsListResponse["data"];
	refetch: () => Promise<unknown>;
	response: PostsListResponse | null;
};

export const usePosts = (
	userUuid: string | null | undefined,
	page = 1,
	itemsPerPage = 25,
): PostsState => {
	const query = useQuery<PostsListResponse, Error>({
		enabled: Boolean(userUuid),
		queryFn: () => getUserPosts(userUuid ?? "", page, itemsPerPage),
		queryKey: postsQueryKey(userUuid, page, itemsPerPage),
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