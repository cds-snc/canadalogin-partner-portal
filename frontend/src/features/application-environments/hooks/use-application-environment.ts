import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
	getApplicationEnvironment,
	type ApplicationEnvironmentRead,
} from "@/fetch/application-environments";

export const useApplicationEnvironment = (
	applicationUuid: string,
	environmentUuid: string
): UseQueryResult<ApplicationEnvironmentRead, Error> =>
	useQuery({
		enabled:
			applicationUuid.trim().length > 0 && environmentUuid.trim().length > 0,
		queryFn: () =>
			getApplicationEnvironment(applicationUuid, environmentUuid),
		queryKey: ["application-environment", applicationUuid, environmentUuid],
	});