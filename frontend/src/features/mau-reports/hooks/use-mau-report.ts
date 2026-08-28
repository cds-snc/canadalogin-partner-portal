import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
	getAccessibleRPApplicationMauReport,
	type MAUReportResponseRead,
} from "@/fetch/mau-report";
import { accessibleRPApplicationsQueryKey } from "@/features/your-applications/query-keys";

export const mauReportQueryKey = (
	workspaceUuid: string,
	rpApplicationUuid: string,
	startDate: string,
	endDate: string,
	applicationInformationUuid = ""
) =>
	[
		...accessibleRPApplicationsQueryKey,
		workspaceUuid,
		...(applicationInformationUuid ? [applicationInformationUuid] : []),
		rpApplicationUuid,
		"mau-report",
		startDate,
		endDate,
	] as const;

export const useMauReport = (
	workspaceUuid: string,
	rpApplicationUuid: string,
	startDate: string,
	endDate: string,
	applicationInformationUuid = ""
): UseQueryResult<MAUReportResponseRead, Error> =>
	useQuery<MAUReportResponseRead, Error>({
		enabled:
			workspaceUuid.trim().length > 0 && rpApplicationUuid.trim().length > 0,
		queryFn: () =>
			getAccessibleRPApplicationMauReport(rpApplicationUuid, {
				applicationInformationUuid,
				endDate,
				startDate,
				workspaceUuid,
			}),
		queryKey: mauReportQueryKey(
			workspaceUuid,
			rpApplicationUuid,
			startDate,
			endDate,
			applicationInformationUuid
		),
	});
