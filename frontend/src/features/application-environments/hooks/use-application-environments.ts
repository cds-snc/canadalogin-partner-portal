import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
	getApplicationEnvironments,
	type ApplicationEnvironmentListRead,
} from "@/fetch/application-environments";

export const useApplicationEnvironments = (
	applicationUuid: string,
	page: number,
	itemsPerPage: number
): UseQueryResult<ApplicationEnvironmentListRead, Error> =>
	useQuery({
		enabled: applicationUuid.trim().length > 0,
		queryFn: () =>
			getApplicationEnvironments(applicationUuid, { itemsPerPage, page }),
		queryKey: [
			"application-environments",
			applicationUuid,
			page,
			itemsPerPage,
		],
	});