import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceApplicationCreatePage } from "@/features/workspaces/pages/WorkspaceApplicationCreatePage";
import { useWorkspaceApplicationInformationList } from "@/features/workspaces/hooks/use-workspace-application-information";
import { useWorkspaceRPRegistrationActions } from "@/features/workspaces/hooks/use-workspace-rp-registration";
import type { WorkspaceRPApplicationRegistrationDraftCreate } from "@/fetch/rp-applications";

const navigateMock = vi.fn(() => Promise.resolve());
const createDraftMock = vi.fn(
	(
		_workspaceUuid: string,
		_payload: WorkspaceRPApplicationRegistrationDraftCreate,
		_registrationCreationKey: string
	) =>
		Promise.resolve({
			onboardingState: "draft" as const,
			registrationAnswers: {},
			registrationDraftVersion: 1,
			registrationLastCompletedStep: "basics" as const,
			rpApplicationUuid: "rp-application-uuid-1",
			workspaceUuid: "workspace-uuid-1",
		})
);

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string): string =>
			({
				"workspaces.applicationsCreatePageTitle": "Create RP application",
				"workspaces.applicationsValidationErrorTitle": "Check your answers",
				"workspaces.applicationsValidationRequiredAnswers":
					"Complete required answers.",
				"workspaces.registration.continueAction": "Continue",
				"workspaces.registration.discardChangesWarning":
					"Leave without saving?",
				"workspaces.registration.saveAndExitAction": "Save and exit",
			})[key] ?? key,
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
	useParams: () => ({ workspaceUuid: "workspace-uuid-1" }),
}));

vi.mock("@/components/ui", () => ({
	ErrorSummary: (): ReactElement => <div role="alert">Check your answers</div>,
	Heading: ({ children }: PropsWithChildren): ReactElement => (
		<h1>{children}</h1>
	),
	Notice: ({
		children,
		noticeTitle,
	}: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/features/workspaces/components/WorkspaceRPApplicationForm", () => ({
	WorkspaceRPApplicationForm: ({
		fieldErrors,
		onChange,
		onCancel,
		onSaveAndExit,
		onSubmit,
		saveAndExitLabel,
		submitLabel,
	}: {
		fieldErrors: Record<string, string>;
		onChange: (field: string, value: string) => void;
		onCancel: () => void;
		onSaveAndExit: () => void;
		onSubmit: () => void;
		saveAndExitLabel: string;
		submitLabel: string;
	}): ReactElement => (
		<section>
			<output data-testid="field-errors">{JSON.stringify(fieldErrors)}</output>
			<button
				type="button"
				onClick={() => {
					onChange("canadaLoginEnvironment", "staging");
					onChange("serviceNameEn", "Benefits Portal");
					onChange("serviceNameFr", "Portail des prestations");
				}}
			>
				Fill Basics
			</button>
			<button type="button" onClick={onSubmit}>
				{submitLabel}
			</button>
			<button type="button" onClick={onSaveAndExit}>
				{saveAndExitLabel}
			</button>
			<button type="button" onClick={onCancel}>
				Cancel
			</button>
		</section>
	),
}));

vi.mock(
	"@/features/workspaces/hooks/use-workspace-application-information",
	() => ({
		useWorkspaceApplicationInformationList: vi.fn(),
	})
);
vi.mock("@/features/workspaces/hooks/use-workspace-rp-registration", () => ({
	useWorkspaceRPRegistrationActions: vi.fn(),
}));

describe("WorkspaceApplicationCreatePage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useWorkspaceApplicationInformationList).mockReturnValue({
			applicationInformationRecords: [],
			error: null,
			isLoading: false,
			refetch: vi.fn(),
		});
		vi.mocked(useWorkspaceRPRegistrationActions).mockReturnValue({
			createDraft: createDraftMock,
			isCreating: false,
			isSaving: false,
			isSubmitting: false,
			saveDraft: vi.fn(),
			submit: vi.fn(),
		});
	});

	it("creates one minimum Basics draft and continues to Endpoints", async () => {
		render(<WorkspaceApplicationCreatePage />);
		fireEvent.click(screen.getByRole("button", { name: "Fill Basics" }));
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));

		await waitFor(() => expect(createDraftMock).toHaveBeenCalled());
		expect(createDraftMock.mock.calls[0]?.[0]).toBe("workspace-uuid-1");
		expect(createDraftMock.mock.calls[0]?.[1]).toEqual({
			canadaLoginEnvironment: "staging",
			serviceNameEn: "Benefits Portal",
			serviceNameFr: "Portail des prestations",
		});
		expect(createDraftMock.mock.calls[0]?.[2]).toMatch(/^[0-9a-f-]{36}$/u);
		await waitFor(() =>
			expect(navigateMock).toHaveBeenCalledWith({
				href: "/workspaces/workspace-uuid-1/applications/rp-application-uuid-1/registration/endpoints",
				replace: true,
			})
		);
	});

	it("does not create a placeholder when Basics is invalid", () => {
		render(<WorkspaceApplicationCreatePage />);
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));
		expect(createDraftMock).not.toHaveBeenCalled();
		expect(screen.getByRole("alert")).toBeTruthy();
		expect(screen.getByTestId("field-errors").textContent).toContain(
			"serviceNameEn"
		);
	});

	it("creates a recoverable draft before Save and exit leaves Basics", async () => {
		render(<WorkspaceApplicationCreatePage />);
		fireEvent.click(screen.getByRole("button", { name: "Fill Basics" }));
		fireEvent.click(screen.getByRole("button", { name: "Save and exit" }));

		await waitFor(() => expect(createDraftMock).toHaveBeenCalledTimes(1));
		await waitFor(() =>
			expect(navigateMock).toHaveBeenCalledWith({
				href: "/workspaces/workspace-uuid-1/applications/rp-application-uuid-1",
				replace: true,
			})
		);
	});

	it("warns before Cancel discards unsaved Basics input", () => {
		const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(false);
		render(<WorkspaceApplicationCreatePage />);
		fireEvent.click(screen.getByRole("button", { name: "Fill Basics" }));
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

		expect(confirmMock).toHaveBeenCalledWith("Leave without saving?");
		expect(navigateMock).not.toHaveBeenCalled();
	});
});
