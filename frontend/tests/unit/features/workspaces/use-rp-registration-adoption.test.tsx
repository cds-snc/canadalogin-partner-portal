import type { PropsWithChildren, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { linkRPApplicationToWorkspace } from "@/fetch/rp-applications";
import {
	rpRegistrationAdoptionCandidatesQueryKey,
	rpRegistrationAdoptionPreviewQueryKey,
	useRPRegistrationAdoptionActions,
} from "@/features/workspaces/hooks/use-rp-registration-adoption";
import {
	workspaceRPApplicationQueryKey,
	workspaceRPApplicationsQueryKey,
} from "@/features/workspaces/hooks/use-workspace-rp-applications";
import { workspacesQueryKey } from "@/features/workspaces/hooks/use-workspaces";

vi.mock("@/fetch/rp-applications", () => ({
	getRPApplicationAdoptionCandidatePreview: vi.fn(),
	getRPApplicationAdoptionCandidates: vi.fn(),
	linkRPApplicationToWorkspace: vi.fn(),
}));

const rpApplicationUuid = "rp-application-1";
const workspaceUuid = "workspace-1";

describe("useRPRegistrationAdoptionActions", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(linkRPApplicationToWorkspace).mockResolvedValue({
			applicationInformationUuid: "application-information-1",
			canadaLoginEnvironment: "production",
			configurationName: "Benefits production",
			partnerEnvironment: null,
			conflictingFieldNames: [],
			departmentUuid: "department-1",
			filledFieldNames: ["redirectUris"],
			ibmApplicationId: "ibm-app-1",
			idempotentReplay: false,
			name: "Benefits Portal",
			preservedLocalFieldNames: ["displayName"],
			rpApplicationUuid,
			workspaceUuid,
		});
	});

	it("invalidates candidate, workspace, and adopted application state", async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				mutations: { retry: false },
				queries: { retry: false },
			},
		});
		const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
		const wrapper = ({ children }: PropsWithChildren): ReactElement => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
		const { result } = renderHook(() => useRPRegistrationAdoptionActions(), {
			wrapper,
		});

		await act(async () => {
			await result.current.linkToWorkspace(rpApplicationUuid, {
				applicationInformationUuid: "application-information-uuid-1",
				canadaLoginEnvironment: "production",
				workspaceUuid,
			});
		});

		expect(linkRPApplicationToWorkspace).toHaveBeenCalledWith(
			rpApplicationUuid,
			{
				applicationInformationUuid: "application-information-uuid-1",
				canadaLoginEnvironment: "production",
				workspaceUuid,
			}
		);
		for (const queryKey of [
			rpRegistrationAdoptionCandidatesQueryKey,
			rpRegistrationAdoptionPreviewQueryKey(rpApplicationUuid),
			workspacesQueryKey,
			workspaceRPApplicationsQueryKey(workspaceUuid),
			workspaceRPApplicationQueryKey(workspaceUuid, rpApplicationUuid),
		]) {
			expect(invalidateQueries).toHaveBeenCalledWith({
				exact: true,
				queryKey,
			});
		}
	});
});
