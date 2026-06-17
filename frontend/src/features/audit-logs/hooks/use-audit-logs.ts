import { useQuery } from "@tanstack/react-query";
import {
  getAuditLogs,
  type AuditLogsListResponse,
} from "@/fetch/audit-logs";

export const auditLogsQueryKey = (
  page: number,
  itemsPerPage: number,
  createdAtGte?: string,
  createdAtLte?: string,
) => ["audit-logs", page, itemsPerPage, createdAtGte, createdAtLte] as const;

export type AuditLogsState = {
  auditLogs: AuditLogsListResponse["data"];
  error: Error | null;
  isLoading: boolean;
  itemsPerPage: number;
  page: number;
  refetch: () => Promise<unknown>;
  response: AuditLogsListResponse | null;
};

export const useAuditLogs = (
  page = 1,
  itemsPerPage = 10,
  createdAtGte?: string,
  createdAtLte?: string,
): AuditLogsState => {
  const query = useQuery<AuditLogsListResponse, Error>({
    queryFn: () => getAuditLogs(page, itemsPerPage, createdAtGte, createdAtLte),
    queryKey: auditLogsQueryKey(page, itemsPerPage, createdAtGte, createdAtLte),
  });

  return {
    auditLogs: query.data?.data ?? [],
    error: query.error ?? null,
    isLoading: query.isLoading,
    itemsPerPage,
    page,
    refetch: () => query.refetch(),
    response: query.data ?? null,
  };
};
