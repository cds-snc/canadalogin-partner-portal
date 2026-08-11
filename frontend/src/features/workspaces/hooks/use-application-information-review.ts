import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createApplicationInformationReviewNote as postApplicationInformationReviewNote,
	getApplicationInformationReviewContext,
	upsertApplicationInformationReviewChecklistSummary,
	type ApplicationInformationReviewChecklistSummaryRead,
	type ApplicationInformationReviewChecklistSummaryWrite,
	type ApplicationInformationReviewContextRead,
	type ApplicationInformationReviewNoteCreate,
	type ApplicationInformationReviewNoteRead,
} from "@/fetch/workspaces";

export const applicationInformationReviewQueryKey = (
	workspaceUuid: string,
	applicationInformationUuid: string
) =>
	[
		"workspace-application-information-review",
		workspaceUuid,
		applicationInformationUuid,
	] as const;

export type ApplicationInformationReviewState = {
	addNote: (
		payload: ApplicationInformationReviewNoteCreate
	) => Promise<ApplicationInformationReviewNoteRead>;
	checklistSummary: ApplicationInformationReviewChecklistSummaryRead | null;
	error: Error | null;
	isAddingNote: boolean;
	isLoading: boolean;
	isSavingChecklist: boolean;
	notes: Array<ApplicationInformationReviewNoteRead>;
	refetch: () => Promise<unknown>;
	saveChecklistSummary: (
		payload: ApplicationInformationReviewChecklistSummaryWrite
	) => Promise<ApplicationInformationReviewChecklistSummaryRead>;
};

export const useApplicationInformationReview = (
	workspaceUuid: string,
	applicationInformationUuid: string,
	enabled = true
): ApplicationInformationReviewState => {
	const queryClient = useQueryClient();
	const query = useQuery<ApplicationInformationReviewContextRead, Error>({
		enabled:
			enabled &&
			workspaceUuid.length > 0 &&
			applicationInformationUuid.length > 0,
		queryFn: () =>
			getApplicationInformationReviewContext(
				workspaceUuid,
				applicationInformationUuid
			),
		queryKey: applicationInformationReviewQueryKey(
			workspaceUuid,
			applicationInformationUuid
		),
	});

	const refreshReview = async (): Promise<void> => {
		await queryClient.invalidateQueries({
			queryKey: applicationInformationReviewQueryKey(
				workspaceUuid,
				applicationInformationUuid
			),
		});
	};

	const addNoteMutation = useMutation({
		mutationFn: (payload: ApplicationInformationReviewNoteCreate) =>
			postApplicationInformationReviewNote(
				workspaceUuid,
				applicationInformationUuid,
				payload
			),
		onSuccess: refreshReview,
	});

	const checklistMutation = useMutation({
		mutationFn: (payload: ApplicationInformationReviewChecklistSummaryWrite) =>
			upsertApplicationInformationReviewChecklistSummary(
				workspaceUuid,
				applicationInformationUuid,
				payload
			),
		onSuccess: refreshReview,
	});

	return {
		addNote: (
			payload: ApplicationInformationReviewNoteCreate
		): Promise<ApplicationInformationReviewNoteRead> =>
			addNoteMutation.mutateAsync(payload),
		checklistSummary: query.data?.checklistSummary ?? null,
		error: query.error ?? null,
		isAddingNote: addNoteMutation.isPending,
		isLoading: query.isLoading,
		isSavingChecklist: checklistMutation.isPending,
		notes: query.data?.notes ?? [],
		refetch: () => query.refetch(),
		saveChecklistSummary: (
			payload: ApplicationInformationReviewChecklistSummaryWrite
		): Promise<ApplicationInformationReviewChecklistSummaryRead> =>
			checklistMutation.mutateAsync(payload),
	};
};