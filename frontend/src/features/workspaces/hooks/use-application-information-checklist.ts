import { useQuery } from "@tanstack/react-query";
import {
	getApplicationInformationChecklist,
	type ApplicationInformationChecklistRead,
} from "@/fetch/workspaces";

export type ApplicationInformationChecklistState = {
	checklist: ApplicationInformationChecklistRead | null;
	error: Error | null;
	isLoading: boolean;
	refetch: () => Promise<unknown>;
};

export const useApplicationInformationChecklist = (
	workspaceUuid: string,
	applicationInformationUuid: string
): ApplicationInformationChecklistState => {
	const query = useQuery<ApplicationInformationChecklistRead, Error>({
		enabled: workspaceUuid.length > 0 && applicationInformationUuid.length > 0,
		queryFn: () =>
			getApplicationInformationChecklist(
				workspaceUuid,
				applicationInformationUuid
			),
		queryKey: [
			"workspace-application-information-checklist",
			workspaceUuid,
			applicationInformationUuid,
		],
	});

	return {
		checklist: query.data ?? null,
		error: query.error ?? null,
		isLoading: query.isLoading,
		refetch: () => query.refetch(),
	};
};
