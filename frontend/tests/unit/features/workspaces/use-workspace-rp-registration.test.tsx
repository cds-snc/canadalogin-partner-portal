import type { PropsWithChildren, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createWorkspaceRPApplicationRegistrationDraft,
	getWorkspaceRPApplicationRegistrationDraft,
	completeWorkspaceRPApplicationRegistration,
	type WorkspaceRPApplicationRegistrationDraftRead,
	updateWorkspaceRPApplicationRegistrationDraft,
} from "@/fetch/rp-applications";
import {
	useWorkspaceRPRegistrationActions,
	useWorkspaceRPRegistrationDraft,
	workspaceRPRegistrationDraftQueryKey,
} from "@/features/workspaces/hooks/use-workspace-rp-registration";
import {
	workspaceRPApplicationQueryKey,
	workspaceRPApplicationsQueryKey,
} from "@/features/workspaces/hooks/use-workspace-rp-applications";

vi.mock("@/fetch/rp-applications", () => ({
	createWorkspaceRPApplicationRegistrationDraft: vi.fn(),
	getWorkspaceRPApplicationRegistrationDraft: vi.fn(),
	completeWorkspaceRPApplicationRegistration: vi.fn(),
	updateWorkspaceRPApplicationRegistrationDraft: vi.fn(),
}));

const workspaceUuid = "workspace-1";
const rpApplicationUuid = "rp-1";
const draft = {
	applicationInformationUuid: "application-information-uuid-1",
	configurationName: "Test integration A",
	registrationCompletedAt: null,
	registrationAnswers: {
		canadaLoginEnvironment: "test" as const,
		serviceNameEn: "Benefits Portal",
		serviceNameFr: "Portail des prestations",
	},
	registrationDraftVersion: 1,
	registrationLastCompletedStep: "basics" as const,
	rpApplicationUuid,
	workspaceUuid,
};

describe("useWorkspaceRPRegistrationActions", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(createWorkspaceRPApplicationRegistrationDraft).mockResolvedValue(
			draft
		);
		vi.mocked(updateWorkspaceRPApplicationRegistrationDraft).mockResolvedValue({
			...draft,
			registrationDraftVersion: 2,
			registrationLastCompletedStep: "endpoints",
		});
		vi.mocked(completeWorkspaceRPApplicationRegistration).mockResolvedValue({
			applicationInformationUuid: "application-information-uuid-1",
			registrationCompletedAt: "2026-08-25T12:00:00Z",
			registrationDraftVersion: 3,
			rpApplicationUuid,
			serviceNameEn: "Benefits Portal",
			serviceNameFr: "Portail des prestations",
			workspaceUuid,
		});
	});

	it("keeps draft, list, and detail query caches consistent after writes", async () => {
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
		const { result } = renderHook(() => useWorkspaceRPRegistrationActions(), {
			wrapper,
		});

		await act(async () => {
			await result.current.createDraft(
				workspaceUuid,
				{
					applicationInformationUuid: "application-information-uuid-1",
					canadaLoginEnvironment: "test",
					configurationName: "Partner test integration",
					partnerEnvironment: "Partner test",
					serviceNameEn: "Benefits Portal",
					serviceNameFr: "Portail des prestations",
				},
				"creation-key-1"
			);
		});
		expect(
			queryClient.getQueryData(
				workspaceRPRegistrationDraftQueryKey(workspaceUuid, rpApplicationUuid)
			)
		).toEqual(draft);
		expect(invalidateQueries).toHaveBeenCalledWith({
			exact: true,
			queryKey: workspaceRPApplicationsQueryKey(workspaceUuid),
		});

		await act(async () => {
			await result.current.saveDraft(workspaceUuid, rpApplicationUuid, {
				expectedDraftVersion: 1,
				registrationAnswers: { logoutMode: "back_channel" },
				saveMode: "completeStep",
				stepId: "endpoints",
			});
		});
		expect(
			queryClient.getQueryData(
				workspaceRPRegistrationDraftQueryKey(workspaceUuid, rpApplicationUuid)
			)
		).toEqual(expect.objectContaining({ registrationDraftVersion: 2 }));

		await act(async () => {
			await result.current.complete(workspaceUuid, rpApplicationUuid, 2);
		});
		expect(invalidateQueries).toHaveBeenCalledWith({
			exact: true,
			queryKey: workspaceRPApplicationQueryKey(
				workspaceUuid,
				rpApplicationUuid
			),
		});
	});

	it("does not treat stale cached data as a successful conflict reload", async () => {
		vi.mocked(getWorkspaceRPApplicationRegistrationDraft)
			.mockResolvedValueOnce(draft)
			.mockRejectedValueOnce(new Error("network unavailable"));
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		const wrapper = ({ children }: PropsWithChildren): ReactElement => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
		const { result } = renderHook(
			() => useWorkspaceRPRegistrationDraft(workspaceUuid, rpApplicationUuid),
			{ wrapper }
		);
		await waitFor(() => expect(result.current.draft).toEqual(draft));

		let refreshedDraft: WorkspaceRPApplicationRegistrationDraftRead | null =
			draft;
		await act(async () => {
			refreshedDraft = await result.current.refetch();
		});

		expect(refreshedDraft).toBeNull();
		expect(result.current.draft).toEqual(draft);
		await waitFor(() =>
			expect(result.current.error?.message).toBe("network unavailable")
		);
	});
});
