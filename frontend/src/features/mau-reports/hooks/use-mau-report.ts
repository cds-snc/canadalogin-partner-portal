import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
	getCurrentUserRPApplicationMauReport,
	type MAUReportResponseRead,
} from "@/fetch/mau-report";

export const mauReportQueryKey = (
	rpApplicationUuid: string,
	startDate: string,
	endDate: string
) => ["mau-report", rpApplicationUuid, startDate, endDate] as const;

export const useMauReport = (
	rpApplicationUuid: string,
	startDate: string,
	endDate: string
): UseQueryResult<MAUReportResponseRead, Error> =>
	useQuery<MAUReportResponseRead, Error>({
		enabled: rpApplicationUuid.trim().length > 0,
		queryFn: () =>
			getCurrentUserRPApplicationMauReport(rpApplicationUuid, {
				endDate,
				startDate,
			}),
		queryKey: mauReportQueryKey(rpApplicationUuid, startDate, endDate),
	});
