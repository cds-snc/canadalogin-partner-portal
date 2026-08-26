import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createApplicationInformationContact as postApplicationInformationContact,
	deleteApplicationInformationContact as removeApplicationInformationContact,
	getApplicationInformationContacts,
	updateApplicationInformationContact as patchApplicationInformationContact,
	type ApplicationInformationContactCreate,
	type ApplicationInformationContactRead,
	type ApplicationInformationContactUpdate,
} from "@/fetch/workspaces";

export const applicationInformationContactsQueryKey = (
	workspaceUuid: string,
	applicationInformationUuid: string
) =>
	[
		"workspace-application-information-contacts",
		workspaceUuid,
		applicationInformationUuid,
	] as const;

export type ApplicationInformationContactsState = {
	addContact: (
		payload: ApplicationInformationContactCreate
	) => Promise<ApplicationInformationContactRead>;
	contacts: Array<ApplicationInformationContactRead>;
	error: Error | null;
	isAdding: boolean;
	isDeleting: boolean;
	isLoading: boolean;
	isUpdating: boolean;
	refetch: () => Promise<unknown>;
	removeContact: (contactUuid: string) => Promise<void>;
	updateContact: (
		contactUuid: string,
		payload: ApplicationInformationContactUpdate
	) => Promise<ApplicationInformationContactRead>;
};

export const useApplicationInformationContacts = (
	workspaceUuid: string,
	applicationInformationUuid: string,
	enabled = true
): ApplicationInformationContactsState => {
	const queryClient = useQueryClient();
	const query = useQuery<Array<ApplicationInformationContactRead>, Error>({
		enabled:
			enabled &&
			workspaceUuid.length > 0 &&
			applicationInformationUuid.length > 0,
		queryFn: () =>
			getApplicationInformationContacts(
				workspaceUuid,
				applicationInformationUuid
			),
		queryKey: applicationInformationContactsQueryKey(
			workspaceUuid,
			applicationInformationUuid
		),
	});

	const refreshContacts = async (): Promise<void> => {
		await queryClient.invalidateQueries({
			queryKey: applicationInformationContactsQueryKey(
				workspaceUuid,
				applicationInformationUuid
			),
		});
	};

	const addMutation = useMutation({
		mutationFn: (payload: ApplicationInformationContactCreate) =>
			postApplicationInformationContact(
				workspaceUuid,
				applicationInformationUuid,
				payload
			),
		onSuccess: refreshContacts,
	});

	const updateMutation = useMutation({
		mutationFn: ({
			contactUuid,
			payload,
		}: {
			contactUuid: string;
			payload: ApplicationInformationContactUpdate;
		}) =>
			patchApplicationInformationContact(
				workspaceUuid,
				applicationInformationUuid,
				contactUuid,
				payload
			),
		onSuccess: refreshContacts,
	});

	const removeMutation = useMutation({
		mutationFn: (contactUuid: string) =>
			removeApplicationInformationContact(
				workspaceUuid,
				applicationInformationUuid,
				contactUuid
			),
		onSuccess: refreshContacts,
	});

	return {
		addContact: (
			payload: ApplicationInformationContactCreate
		): Promise<ApplicationInformationContactRead> =>
			addMutation.mutateAsync(payload),
		contacts: query.data ?? [],
		error: query.error ?? null,
		isAdding: addMutation.isPending,
		isDeleting: removeMutation.isPending,
		isLoading: query.isLoading,
		isUpdating: updateMutation.isPending,
		refetch: () => query.refetch(),
		removeContact: async (contactUuid: string): Promise<void> => {
			await removeMutation.mutateAsync(contactUuid);
		},
		updateContact: (
			contactUuid: string,
			payload: ApplicationInformationContactUpdate
		): Promise<ApplicationInformationContactRead> =>
			updateMutation.mutateAsync({ contactUuid, payload }),
	};
};
