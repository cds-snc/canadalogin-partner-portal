import { requestJson } from "@/fetch";

export type MAUReportItemRead = {
	application_name: string;
	date: string;
	failed_logins: number;
	mtd_unique_users: number;
	successful_logins: number;
	total_logins: number;
	unique_users: number;
};

export type MAUReportResponseRead = {
	application_name: string;
	application_information_uuid: string;
	application_name_en: string;
	application_name_fr: string;
	canada_login_environment?: string | null;
	configuration_name: string;
	department_name?: string | null;
	department_name_fr?: string | null;
	end_date: string;
	partner_environment?: string | null;
	records: Array<MAUReportItemRead>;
	rp_configuration_uuid: string;
	start_date: string;
	workspace_name: string;
	workspace_uuid: string;
};

export type MAUReportDestinationRead = {
	applicationInformationUuid: string;
	applicationNameEn: string;
	applicationNameFr: string;
	canadaLoginEnvironment?: string | null;
	configurationName: string;
	partnerEnvironment?: string | null;
	uuid: string;
	workspaceName: string;
	workspaceUuid: string;
};

type MAUReportQuery = {
	applicationInformationUuid?: string;
	endDate?: string;
	startDate?: string;
	workspaceUuid?: string;
};

const buildMauReportQuery = ({
	applicationInformationUuid,
	endDate,
	startDate,
	workspaceUuid,
}: MAUReportQuery): string => {
	const params = new URLSearchParams();

	if (startDate && startDate.trim().length > 0) {
		params.set("start_date", startDate);
	}

	if (endDate && endDate.trim().length > 0) {
		params.set("end_date", endDate);
	}

	if (workspaceUuid && workspaceUuid.trim().length > 0) {
		params.set("workspaceUuid", workspaceUuid);
	}

	if (
		applicationInformationUuid &&
		applicationInformationUuid.trim().length > 0
	) {
		params.set("applicationInformationUuid", applicationInformationUuid);
	}

	const query = params.toString();
	return query.length > 0 ? `?${query}` : "";
};

export const getAccessibleRPApplicationMauReport = async (
	rpApplicationUuid: string,
	query: MAUReportQuery
): Promise<MAUReportResponseRead> => {
	const queryString = buildMauReportQuery(query);
	const result = await requestJson<MAUReportResponseRead | null>(
		`/api/v1/rp-applications/accessible/${encodeURIComponent(rpApplicationUuid)}/mau-report${queryString}`,
		{
			cache: "no-store",
			method: "GET",
		}
	);

	if (!result) {
		throw new Error("Failed to load MAU report");
	}

	return result;
};

export const getAccessibleMauReportDestinations = async (): Promise<
	Array<MAUReportDestinationRead>
> => {
	const result = await requestJson<Array<MAUReportDestinationRead> | null>(
		"/api/v1/rp-applications/accessible/mau-report-destinations",
		{
			cache: "no-store",
			method: "GET",
		}
	);
	return result ?? [];
};
