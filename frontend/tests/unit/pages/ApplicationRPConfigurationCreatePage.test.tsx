import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkspaceApplicationInformation } from "@/features/workspaces/hooks/use-workspace-application-information";
import { useWorkspaceRPRegistrationActions } from "@/features/workspaces/hooks/use-workspace-rp-registration";
import { ApplicationRPConfigurationCreatePage } from "@/features/workspaces/pages/ApplicationRPConfigurationCreatePage";

const navigateMock = vi.fn(() => Promise.resolve());
const createApplicationDraftMock = vi.fn(() =>
	Promise.resolve({
		applicationInformationUuid: "application-1",
		configurationName: "Partner staging A",
		onboardingState: "draft" as const,
		registrationAnswers: {},
		registrationDraftVersion: 1,
		registrationLastCompletedStep: "basics" as const,
		rpApplicationUuid: "configuration-1",
		workspaceUuid: "workspace-1",
	})
);

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { resolvedLanguage: "en" },
		t: (key: string): string =>
			({
				"workspaces.registration.continueAction": "Continue",
				"workspaces.registration.discardChangesWarning":
					"Leave without saving?",
				"workspaces.registration.saveAndExitAction": "Save and exit",
				"workspaces.rpConfigurationCreatePageTitle": "Create RP configuration",
			})[key] ?? key,
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
	useParams: () => ({
		applicationInformationUuid: "application-1",
		workspaceUuid: "workspace-1",
	}),
}));

vi.mock("@/components/ui", () => ({
	ErrorSummary: (): ReactElement => <div role="alert">Check your answers</div>,
	Heading: ({ children }: PropsWithChildren): ReactElement => (
		<h1>{children}</h1>
	),
	Notice: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/features/workspaces/components/WorkspaceRPApplicationForm", () => ({
	WorkspaceRPApplicationForm: ({
		applicationContextName,
		onChange,
		onSubmit,
		submitLabel,
	}: {
		applicationContextName?: string;
		onChange: (field: string, value: string) => void;
		onSubmit: () => void;
		submitLabel: string;
	}): ReactElement => (
		<section>
			<p>Application: {applicationContextName}</p>
			<button
				type="button"
				onClick={() => {
					onChange("configurationName", "Partner staging A");
					onChange("partnerEnvironment", "Partner staging");
					onChange("canadaLoginEnvironment", "staging");
				}}
			>
				Fill Basics
			</button>
			<button type="button" onClick={onSubmit}>
				{submitLabel}
			</button>
		</section>
	),
}));

vi.mock(
	"@/features/workspaces/hooks/use-workspace-application-information",
	() => ({ useWorkspaceApplicationInformation: vi.fn() })
);
vi.mock("@/features/workspaces/hooks/use-workspace-rp-registration", () => ({
	useWorkspaceRPRegistrationActions: vi.fn(),
}));

describe("ApplicationRPConfigurationCreatePage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useWorkspaceApplicationInformation).mockReturnValue({
			applicationInformation: {
				serviceNameEn: "Benefits Portal",
				serviceNameFr: "Portail des prestations",
			} as never,
			error: null,
			isLoading: false,
			refetch: vi.fn(() => Promise.resolve()),
		});
		vi.mocked(useWorkspaceRPRegistrationActions).mockReturnValue({
			createApplicationDraft: createApplicationDraftMock,
			createDraft: vi.fn(),
			isCreating: false,
			isSaving: false,
			isSubmitting: false,
			saveDraft: vi.fn(),
			submit: vi.fn(),
		});
	});

	it("creates nested Basics with configuration identity only", async () => {
		render(<ApplicationRPConfigurationCreatePage />);

		expect(screen.getByText("Application: Benefits Portal")).toBeTruthy();
		expect(screen.queryByLabelText(/Service name/)).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: "Fill Basics" }));
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));

		await waitFor(() => expect(createApplicationDraftMock).toHaveBeenCalled());
		expect(createApplicationDraftMock.mock.calls[0]?.slice(0, 3)).toEqual([
			"workspace-1",
			"application-1",
			{
				canadaLoginEnvironment: "staging",
				configurationName: "Partner staging A",
				partnerEnvironment: "Partner staging",
			},
		]);
		await waitFor(() =>
			expect(navigateMock).toHaveBeenCalledWith({
				href: "/workspaces/workspace-1/applications/application-1/rp-configurations/configuration-1/registration/endpoints",
				replace: true,
			})
		);
	});
});
