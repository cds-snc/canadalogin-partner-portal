import { useQuery } from "@tanstack/react-query";
import {
	getHealthCheck,
	getReadyCheck,
	type HealthCheck,
	type ReadyCheck,
} from "@/fetch/system";

export type SystemStatusState = {
	health: HealthCheck | null;
	ready: ReadyCheck | null;
	isLoading: boolean;
};

export const useSystemStatus = (): SystemStatusState => {
	const healthQuery = useQuery<HealthCheck, Error>({
		queryKey: ["system", "health"],
		queryFn: getHealthCheck,
		retry: false,
	});

	const readyQuery = useQuery<ReadyCheck, Error>({
		queryKey: ["system", "ready"],
		queryFn: getReadyCheck,
		retry: false,
	});

	return {
		health: healthQuery.data ?? null,
		ready: readyQuery.data ?? null,
		isLoading: healthQuery.isLoading || readyQuery.isLoading,
	};
};
