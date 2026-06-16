import { requestJson } from "@/fetch";

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
  createdAtLte?: string,
): Promise<AuditLogsListResponse> => {
  const searchParameters = new URLSearchParams();
  searchParameters.set("items_per_page", String(itemsPerPage));
  searchParameters.set("page", String(page));
  if (createdAtGte) {
    searchParameters.set("created_at_gte", createdAtGte);
  }
  if (createdAtLte) {
    searchParameters.set("created_at_lte", createdAtLte);
  }
  return (await requestJson<AuditLogsListResponse>(
    `/api/v1/audit-logs?${searchParameters.toString()}`,
    { cache: "no-store", method: "GET" },
  )) as AuditLogsListResponse;
};
