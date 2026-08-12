import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	clearDevSession,
	getDevSession,
	selectDevSessionFixture,
	type DevSessionFixture,
	type DevSessionRead,
} from "@/fetch/dev-session";

export const devSessionQueryKey = ["dev-session"] as const;

export class UnknownDevSessionFixtureError extends Error {
	public constructor() {
		super("The selected local persona is not in the server allowlist.");
		this.name = "UnknownDevSessionFixtureError";
	}
}

export type DevSessionState = {
	clearSession: () => Promise<void>;
	currentFixture: DevSessionFixture | null;
	devSession: DevSessionRead | null | undefined;
	error: Error | null;
	isClearing: boolean;
	isLoading: boolean;
	isSelecting: boolean;
	selectFixture: (fixtureId: string) => Promise<void>;
};

export const getCurrentDevSessionFixture = (
	devSession: DevSessionRead | null | undefined
): DevSessionFixture | null => {
	if (!devSession?.currentFixtureId) {
		return null;
	}

	return (
		devSession.fixtures.find(
			(fixture) => fixture.fixtureId === devSession.currentFixtureId
		) ?? null
	);
};

export const useDevSession = (
	options: { enabled?: boolean } = {}
): DevSessionState => {
	const queryClient = useQueryClient();
	const query = useQuery({
		enabled: options.enabled ?? true,
		queryFn: getDevSession,
		queryKey: devSessionQueryKey,
		retry: false,
	});

	const refreshDevSession = async (): Promise<void> => {
		await queryClient.invalidateQueries({ queryKey: devSessionQueryKey });
	};

	const selectMutation = useMutation({
		mutationFn: async (fixtureId: string): Promise<void> => {
			const isAllowlisted =
				query.data?.fixtures.some(
					(fixture) => fixture.fixtureId === fixtureId
				) === true;

			if (!isAllowlisted) {
				throw new UnknownDevSessionFixtureError();
			}

			await selectDevSessionFixture(fixtureId);
		},
		onSuccess: refreshDevSession,
	});

	const clearMutation = useMutation({
		mutationFn: clearDevSession,
		onSuccess: refreshDevSession,
	});

	return {
		clearSession: async (): Promise<void> => {
			await clearMutation.mutateAsync();
		},
		currentFixture: getCurrentDevSessionFixture(query.data),
		devSession: query.data,
		error: query.error,
		isClearing: clearMutation.isPending,
		isLoading: query.isLoading,
		isSelecting: selectMutation.isPending,
		selectFixture: async (fixtureId: string): Promise<void> => {
			await selectMutation.mutateAsync(fixtureId);
		},
	};
};
