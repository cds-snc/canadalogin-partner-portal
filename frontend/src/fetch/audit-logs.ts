import { requestJson } from "@/fetch";

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

const normalizeAuditLogBoundary = (
	value: string | undefined,
	boundary: "start" | "end"
): string | undefined => {
	if (!value) {
		return undefined;
	}

	const trimmedValue = value.trim();

	if (trimmedValue.length === 0) {
		return undefined;
	}

	if (dateOnlyPattern.test(trimmedValue)) {
		return `${trimmedValue}T${boundary === "start" ? "00:00:00.000" : "23:59:59.999"}`;
	}

	return trimmedValue;
};

export type AuditLogRead = {
	createdAt: string;
	description: string;
	operation: string;
	target: string;
	targetUuid: string | null;
	user: string;
	userUuid: string | null;
	uuid: string;
};

export type AuditLogsListResponse = {
	data: Array<AuditLogRead>;
	has_more: boolean;
	items_per_page: number;
	page: number;
	total_count: number;
};

export const getAuditLogs = async (
	page = 1,
	itemsPerPage = 10,
	createdAtGte?: string,
	createdAtLte?: string
): Promise<AuditLogsListResponse> => {
	const searchParameters = new URLSearchParams();
	searchParameters.set("items_per_page", String(itemsPerPage));
	searchParameters.set("page", String(page));
	const normalizedCreatedAtGte = normalizeAuditLogBoundary(
		createdAtGte,
		"start"
	);
	const normalizedCreatedAtLte = normalizeAuditLogBoundary(createdAtLte, "end");

	if (normalizedCreatedAtGte) {
		searchParameters.set("created_at_gte", normalizedCreatedAtGte);
	}
	if (normalizedCreatedAtLte) {
		searchParameters.set("created_at_lte", normalizedCreatedAtLte);
	}
	return (await requestJson<AuditLogsListResponse>(
		`/api/v1/audit-logs?${searchParameters.toString()}`,
		{ cache: "no-store", method: "GET" }
	)) as AuditLogsListResponse;
};
