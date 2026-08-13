import type {
	FormEvent,
	PropsWithChildren,
	ReactElement,
	ReactNode,
} from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useApplicationInformationReview } from "@/features/workspaces/hooks/use-application-information-review";
import { useWorkspaceApplicationInformation } from "@/features/workspaces/hooks/use-workspace-application-information";
import { ApplicationInformationInternalReviewPage } from "@/features/workspaces/pages/ApplicationInformationInternalReviewPage";

const addNoteMock = vi.fn(() => Promise.resolve({} as never));
const saveChecklistMock = vi.fn(() => Promise.resolve({} as never));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { resolvedLanguage: "en" },
		t: (key: string): string => key,
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useParams: () => ({
		applicationInformationUuid: "application-information-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		disabled,
		onGcdsClick,
	}: PropsWithChildren<{
		disabled?: boolean;
		onGcdsClick?: () => void;
	}>): ReactElement => (
		<button disabled={disabled} type="button" onClick={onGcdsClick}>
			{children}
		</button>
	),
	Heading: ({
		children,
		tag = "h2",
	}: PropsWithChildren<{ tag?: "h1" | "h2" }>): ReactElement => {
		const Tag = tag;
		return <Tag>{children}</Tag>;
	},
	Grid: ({ children }: PropsWithChildren): ReactElement => <dl>{children}</dl>,
	Notice: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
	),
	Select: ({
		children,
		label,
		name,
		onInput,
		value,
	}: {
		children: ReactNode;
		label: string;
		name: string;
		onInput?: (event: FormEvent<HTMLSelectElement>) => void;
		value?: string;
	}): ReactElement => (
		<label>
			{label}
			<select
				name={name}
				value={value}
				onInput={onInput}
				onChange={() => undefined}
			>
				{children}
			</select>
		</label>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
	Textarea: ({
		label,
		name,
		onInput,
		value,
	}: {
		label: string;
		name: string;
		onInput?: (event: FormEvent<HTMLTextAreaElement>) => void;
		value?: string;
	}): ReactElement => (
		<label>
			{label}
			<textarea
				name={name}
				value={value}
				onInput={onInput}
				onChange={() => undefined}
			/>
		</label>
	),
}));

vi.mock(
	"@/features/workspaces/hooks/use-application-information-review",
	() => ({
		useApplicationInformationReview: vi.fn(),
	})
);

vi.mock(
	"@/features/workspaces/hooks/use-workspace-application-information",
	() => ({
		useWorkspaceApplicationInformation: vi.fn(),
	})
);

describe("ApplicationInformationInternalReviewPage", () => {
	it("keeps checklist and note mutations on the internal-only focused page", async () => {
		vi.mocked(useWorkspaceApplicationInformation).mockReturnValue({
			applicationInformation: {
				createdAt: "2026-08-13T00:00:00Z",
				createdBy: 42,
				deletedAt: null,
				id: 17,
				isDeleted: false,
				migrationOrTransitionPlan: "Plan",
				onboardingState: "under_review",
				overview: "Overview",
				securityAndPrivacy: "Protected B",
				serviceNameEn: "Example service",
				serviceNameFr: "Service exemple",
				technologyAndProtocol: "OIDC",
				updatedAt: null,
				usage: "Usage",
				uuid: "application-information-uuid-1",
				workspaceId: 9,
			},
			error: null,
			isLoading: false,
			refetch: vi.fn(() => Promise.resolve()),
		});
		vi.mocked(useApplicationInformationReview).mockReturnValue({
			addNote: addNoteMock,
			checklistSummary: null,
			error: null,
			isAddingNote: false,
			isLoading: false,
			isSavingChecklist: false,
			notes: [],
			refetch: vi.fn(() => Promise.resolve()),
			saveChecklistSummary: saveChecklistMock,
		});

		render(<ApplicationInformationInternalReviewPage />);

		fireEvent.click(
			screen.getByRole("button", {
				name: "workspaces.appInfoInternalReviewChecklistSaveAction",
			})
		);
		await waitFor(() => {
			expect(saveChecklistMock).toHaveBeenCalledWith({
				applicationInformationStatus: "not_started",
				contactsStatus: "not_started",
				environmentRegistrationStatus: "not_started",
				evidenceReferenceStatus: "not_started",
				processLinksStatus: "not_started",
				promotionMetadataStatus: "not_started",
				rationale: null,
				reviewDisposition: "pending",
			});
		});

		fireEvent.input(
			screen.getByLabelText("workspaces.appInfoInternalReviewNoteLabel"),
			{ target: { value: "Ready for external review" } }
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: "workspaces.appInfoInternalReviewNoteSaveAction",
			})
		);
		await waitFor(() => {
			expect(addNoteMock).toHaveBeenCalledWith({
				body: "Ready for external review",
			});
		});
	});

	it("renders every recorded checklist outcome with localized labels", () => {
		vi.mocked(useWorkspaceApplicationInformation).mockReturnValue({
			applicationInformation: {
				createdAt: "2026-08-13T00:00:00Z",
				createdBy: 42,
				deletedAt: null,
				id: 17,
				isDeleted: false,
				migrationOrTransitionPlan: "Plan",
				onboardingState: "approved",
				overview: "Overview",
				securityAndPrivacy: "Protected B",
				serviceNameEn: "Example service",
				serviceNameFr: "Service exemple",
				technologyAndProtocol: "OIDC",
				updatedAt: null,
				usage: "Usage",
				uuid: "application-information-uuid-1",
				workspaceId: 9,
			},
			error: null,
			isLoading: false,
			refetch: vi.fn(() => Promise.resolve()),
		});
		vi.mocked(useApplicationInformationReview).mockReturnValue({
			addNote: addNoteMock,
			checklistSummary: {
				applicationInformationStatus: "complete",
				applicationInformationId: 17,
				contactsStatus: "incomplete",
				createdAt: "2026-08-13T00:00:00Z",
				environmentRegistrationStatus: "not_started",
				evidenceReferenceStatus: "complete",
				id: 23,
				processLinksStatus: "incomplete",
				promotionMetadataStatus: "complete",
				rationale: "Needs one contact update.",
				reviewDisposition: "changes_requested",
				reviewedByName: "Local CL Admin",
				reviewedByUserUuid: "reviewer-uuid-1",
				updatedAt: "2026-08-13T01:00:00Z",
				uuid: "checklist-uuid-1",
			},
			error: null,
			isAddingNote: false,
			isLoading: false,
			isSavingChecklist: false,
			notes: [],
			refetch: vi.fn(() => Promise.resolve()),
			saveChecklistSummary: saveChecklistMock,
		});

		render(<ApplicationInformationInternalReviewPage />);

		expect(
			screen.getByText(
				"workspaces.appInfoInternalReviewDispositionChangesRequested"
			)
		).toBeTruthy();
		expect(
			screen.getAllByText("workspaces.appInfoReadinessStatusComplete")
		).toHaveLength(3);
		expect(
			screen.getAllByText("workspaces.appInfoReadinessStatusIncomplete")
		).toHaveLength(2);
		expect(
			screen.getByText("workspaces.appInfoReadinessStatusNotStarted")
		).toBeTruthy();
		expect(screen.getByText("Needs one contact update.")).toBeTruthy();
		expect(screen.getByText("Local CL Admin")).toBeTruthy();
	});
});
