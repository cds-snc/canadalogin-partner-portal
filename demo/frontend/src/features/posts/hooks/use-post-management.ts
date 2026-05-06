import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	approvePost as postApproval,
	createPost as postCreate,
	deletePost as removePost,
	rejectPost as postRejection,
	submitPostForReview as postSubmission,
	updatePost as patchPost,
	type PostCreate,
	type PostReviewPayload,
	type PostUpdate,
} from "@/fetch/posts";
import { refreshActiveListQuery } from "@/lib/refresh-active-list-query";
import { pendingReviewPostsQueryKey } from "./use-pending-review-posts";
import { postsQueryKey, usePosts, type PostsState } from "./use-posts";

export type PostManagementState = PostsState & {
	approve: (postUuid: string, payload: PostReviewPayload) => Promise<void>;
	createPost: (payload: PostCreate) => Promise<void>;
	deletePost: (postUuid: string) => Promise<void>;
	isApproving: boolean;
	isCreating: boolean;
	isDeleting: boolean;
	isRejecting: boolean;
	isSubmittingForReview: boolean;
	isUpdating: boolean;
	reject: (postUuid: string, payload: PostReviewPayload) => Promise<void>;
	submitForReview: (postUuid: string) => Promise<void>;
	updatePost: (postUuid: string, payload: PostUpdate) => Promise<void>;
};

export const usePostManagement = (
	userUuid: string | null | undefined,
	page = 1,
	itemsPerPage = 25,
): PostManagementState => {
	const queryClient = useQueryClient();
	const query = usePosts(userUuid, page, itemsPerPage);

	const refreshPosts = async (): Promise<void> => {
		if (!userUuid) {
			return;
		}

		await refreshActiveListQuery(queryClient, {
			exactQueryKey: postsQueryKey(userUuid, page, itemsPerPage),
			invalidationKeys: [["posts", userUuid]],
			refetchActiveQuery: query.refetch,
		});
	};

	const createMutation = useMutation({
		mutationFn: (payload: PostCreate) => postCreate(userUuid ?? "", payload),
		onSuccess: refreshPosts,
	});

	const updateMutation = useMutation({
		mutationFn: ({ payload, postUuid }: { payload: PostUpdate; postUuid: string }) =>
			patchPost(userUuid ?? "", postUuid, payload),
		onSuccess: refreshPosts,
	});

	const deleteMutation = useMutation({
		mutationFn: (postUuid: string) => removePost(userUuid ?? "", postUuid),
		onSuccess: refreshPosts,
	});

	const submitMutation = useMutation({
		mutationFn: (postUuid: string) => postSubmission(userUuid ?? "", postUuid),
		onSuccess: refreshPosts,
	});

	const approveMutation = useMutation({
		mutationFn: ({ payload, postUuid }: { payload: PostReviewPayload; postUuid: string }) =>
			postApproval(postUuid, payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: pendingReviewPostsQueryKey(1, 10) });
		},
	});

	const rejectMutation = useMutation({
		mutationFn: ({ payload, postUuid }: { payload: PostReviewPayload; postUuid: string }) =>
			postRejection(postUuid, payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["pending-review-posts"] });
		},
	});

	return {
		...query,
		approve: async (postUuid: string, payload: PostReviewPayload): Promise<void> => {
			await approveMutation.mutateAsync({ payload, postUuid });
		},
		createPost: async (payload: PostCreate): Promise<void> => {
			await createMutation.mutateAsync(payload);
		},
		deletePost: async (postUuid: string): Promise<void> => {
			await deleteMutation.mutateAsync(postUuid);
		},
		isApproving: approveMutation.isPending,
		isCreating: createMutation.isPending,
		isDeleting: deleteMutation.isPending,
		isRejecting: rejectMutation.isPending,
		isSubmittingForReview: submitMutation.isPending,
		isUpdating: updateMutation.isPending,
		reject: async (postUuid: string, payload: PostReviewPayload): Promise<void> => {
			await rejectMutation.mutateAsync({ payload, postUuid });
		},
		submitForReview: async (postUuid: string): Promise<void> => {
			await submitMutation.mutateAsync(postUuid);
		},
		updatePost: async (postUuid: string, payload: PostUpdate): Promise<void> => {
			await updateMutation.mutateAsync({ payload, postUuid });
		},
	};
};