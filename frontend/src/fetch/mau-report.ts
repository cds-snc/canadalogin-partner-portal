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
	department_name?: string | null;
	end_date: string;
	records: Array<MAUReportItemRead>;
	start_date: string;
};

type MAUReportQuery = {
	endDate?: string;
	startDate?: string;
};

const buildMauReportQuery = ({ endDate, startDate }: MAUReportQuery): string => {
	const params = new URLSearchParams();

	if (startDate && startDate.trim().length > 0) {
		params.set("start_date", startDate);
	}

	if (endDate && endDate.trim().length > 0) {
		params.set("end_date", endDate);
	}

	const query = params.toString();
	return query.length > 0 ? `?${query}` : "";
};

export const getCurrentUserRPApplicationMauReport = async (
	rpApplicationUuid: string,
	query: MAUReportQuery
): Promise<MAUReportResponseRead> => {
	const queryString = buildMauReportQuery(query);
	const result = await requestJson<MAUReportResponseRead | null>(
		`/api/v1/rp-applications/mine/${encodeURIComponent(rpApplicationUuid)}/mau-report${queryString}`,
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
