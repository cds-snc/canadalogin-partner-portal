import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceRPRegistrationStepPage } from "@/features/workspaces/pages/WorkspaceRPRegistrationStepPage";
import { useWorkspaceApplicationInformationList } from "@/features/workspaces/hooks/use-workspace-application-information";
import {
	useWorkspaceRPRegistrationActions,
	useWorkspaceRPRegistrationDraft,
} from "@/features/workspaces/hooks/use-workspace-rp-registration";
import type { WorkspaceRPApplicationRegistrationDraftPatch } from "@/fetch/rp-applications";
import { ConflictRequestError, HttpRequestError } from "@/fetch";

const route = {
	step: "endpoints",
	workspaceUuid: "workspace-1",
	rpApplicationUuid: "rp-1",
};
const navigateMock = vi.fn(() => Promise.resolve());
const saveDraftMock = vi.fn(
	(
		_workspaceUuid: string,
		_rpApplicationUuid: string,
		_payload: WorkspaceRPApplicationRegistrationDraftPatch
	) =>
		Promise.resolve({
			onboardingState: "draft" as const,
			registrationAnswers: {},
			registrationDraftVersion: 3,
			registrationLastCompletedStep: "endpoints" as const,
			rpApplicationUuid: "rp-1",
			workspaceUuid: "workspace-1",
		})
);
const submitMock = vi.fn(() =>
	Promise.resolve({
		onboardingState: "submitted" as const,
		registrationDraftVersion: 7,
		rpApplicationUuid: "rp-1",
		serviceNameEn: "Benefits Portal",
		serviceNameFr: "Portail des prestations",
		workspaceUuid: "workspace-1",
	})
);

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string): string =>
			({
				"workspaces.applicationsSavingAction": "Saving...",
				"workspaces.registration.continueAction": "Continue",
				"workspaces.registration.conflictErrorBody":
					"Reload the latest draft without losing entered answers.",
				"workspaces.registration.conflictErrorTitle":
					"Registration draft changed",
				"workspaces.registration.discardChangesWarning":
					"Leave without saving?",
				"workspaces.registration.loadErrorBody": "Try loading it again.",
				"workspaces.registration.loadErrorTitle": "Unable to load registration",
				"workspaces.registration.reloadAction": "Reload draft",
				"workspaces.registration.retryAction": "Try again",
				"workspaces.registration.retryLoadAction": "Try loading again",
				"workspaces.registration.retrySaveAction": "Try saving again",
				"workspaces.registration.saveAndExitAction": "Save and exit",
				"workspaces.registration.saveErrorBody":
					"Your answers remain on this page.",
				"workspaces.registration.saveErrorTitle": "Unable to save registration",
				"workspaces.registration.submitAction": "Submit registration",
				"workspaces.registration.steps.endpoints": "Endpoints",
				"workspaces.registration.steps.review": "Review",
				"workspaces.registration.validationFieldMessage": "Check this answer.",
				"workspaces.registration.validationGeneralMessage":
					"Check the answers on this step.",
				"workspaces.registration.validationSummaryHeading":
					"The registration could not be saved",
			})[key] ?? key,
	}),
}));
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
	useParams: () => route,
}));
vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		disabled,
		href,
		onGcdsClick,
		type,
	}: PropsWithChildren<{
		disabled?: boolean;
		href?: string;
		onGcdsClick?: () => void;
		type?: string;
	}>): ReactElement =>
		type === "link" ? (
			<a href={href}>{children}</a>
		) : (
			<button disabled={disabled} type="button" onClick={onGcdsClick}>
				{children}
			</button>
		),
	ErrorSummary: ({
		errorLinks,
		focusOnRender,
		heading,
	}: {
		errorLinks?: Record<string, string>;
		focusOnRender?: boolean;
		heading?: string;
	}): ReactElement => (
		<section
			aria-label={heading}
			data-focus-on-render={focusOnRender ? "true" : "false"}
			role="alert"
		>
			{Object.entries(errorLinks ?? {}).map(([href, message]) => (
				<a href={href} key={href}>
					{message}
				</a>
			))}
		</section>
	),
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
		form,
		onBack,
		onChange,
		onCancel,
		onSaveAndExit,
		onSubmit,
		saveAndExitLabel,
		submitLabel,
	}: {
		fieldErrors: Record<string, string>;
		form: Record<string, string | Array<string>>;
		onBack?: () => void;
		onChange: (field: string, value: string | Array<string>) => void;
		onCancel: () => void;
		onSaveAndExit: () => void;
		onSubmit: () => void;
		saveAndExitLabel: string;
		submitLabel: string;
	}): ReactElement => (
		<section>
			<output data-testid="field-errors">{JSON.stringify(fieldErrors)}</output>
			<output data-testid="form-values">{JSON.stringify(form)}</output>
			<button
				type="button"
				onClick={() => {
					onChange("applicationEnvironmentUrlEn", "https://benefits.canada.ca");
					onChange(
						"applicationEnvironmentUrlFr",
						"https://prestations.canada.ca"
					);
					onChange("redirectUris", "https://benefits.canada.ca/callback");
					onChange("logoutMode", "front_channel");
					onChange("logoutUri", "https://benefits.canada.ca/logout");
				}}
			>
				Fill Endpoints
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
			{onBack ? (
				<button type="button" onClick={onBack}>
					Back
				</button>
			) : null}
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
	useWorkspaceRPRegistrationDraft: vi.fn(),
}));

const completeAnswers = {
	applicationEnvironmentUrlEn: "https://benefits.canada.ca",
	applicationEnvironmentUrlFr: "https://prestations.canada.ca",
	canadaLoginEnvironment: "test" as const,
	clientAuthMethod: "client_secret_basic" as const,
	clientType: "confidential" as const,
	logoutMode: "front_channel" as const,
	logoutUri: "https://benefits.canada.ca/logout",
	messageDecryptionRoadmap: false,
	messageDecryptionSupported: false,
	pkceSupported: false,
	redirectUris: ["https://benefits.canada.ca/callback"],
	requestEncryptionRoadmap: false,
	requestEncryptionSupported: false,
	requestSigningRoadmap: false,
	requestSigningSupported: false,
	requestedScopes: ["openid" as const],
	sectorIdentifier: "https://benefits.canada.ca",
	serviceNameEn: "Benefits Portal",
	serviceNameFr: "Portail des prestations",
	sharesPairwiseIdentifiers: false,
	signatureValidationRoadmap: false,
	signatureValidationSupported: false,
	supportsAuthorizationCodeFlow: true,
};

const endpointsDraft = {
	onboardingState: "draft" as const,
	registrationAnswers: {
		canadaLoginEnvironment: "test" as const,
		serviceNameEn: "Benefits Portal",
		serviceNameFr: "Portail des prestations",
	},
	registrationDraftVersion: 2,
	registrationLastCompletedStep: "basics" as const,
	rpApplicationUuid: "rp-1",
	workspaceUuid: "workspace-1",
};

describe("WorkspaceRPRegistrationStepPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		route.step = "endpoints";
		vi.mocked(useWorkspaceApplicationInformationList).mockReturnValue({
			applicationInformationRecords: [],
			error: null,
			isLoading: false,
			refetch: vi.fn(),
		});
		vi.mocked(useWorkspaceRPRegistrationActions).mockReturnValue({
			createDraft: vi.fn(),
			isCreating: false,
			isSaving: false,
			isSubmitting: false,
			saveDraft: saveDraftMock,
			submit: submitMock,
		});
		vi.mocked(useWorkspaceRPRegistrationDraft).mockReturnValue({
			draft: endpointsDraft,
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => endpointsDraft),
		});
	});

	it("completes the current step with its expected version before navigating", async () => {
		render(<WorkspaceRPRegistrationStepPage />);
		fireEvent.click(screen.getByRole("button", { name: "Fill Endpoints" }));
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));

		await waitFor(() => expect(saveDraftMock).toHaveBeenCalled());
		expect(saveDraftMock.mock.calls[0]?.[2]).toEqual(
			expect.objectContaining({
				expectedDraftVersion: 2,
				saveMode: "completeStep",
				stepId: "endpoints",
			})
		);
		await waitFor(() =>
			expect(navigateMock).toHaveBeenCalledWith({
				href: "/workspaces/workspace-1/applications/rp-1/registration/client-and-access",
			})
		);
	});

	it("shows a summary and field errors for an invalid current step", () => {
		render(<WorkspaceRPRegistrationStepPage />);

		fireEvent.click(screen.getByRole("button", { name: "Continue" }));

		expect(
			screen
				.getByRole("alert", {
					name: "The registration could not be saved",
				})
				.getAttribute("data-focus-on-render")
		).toBe("true");
		expect(
			screen.getAllByRole("link", {
				name: /workspaces\.applicationsValidation/,
			}).length
		).toBeGreaterThan(0);
		expect(screen.getByTestId("field-errors").textContent).toContain(
			"applicationEnvironmentUrlEn"
		);
		expect(saveDraftMock).not.toHaveBeenCalled();
	});

	it("maps a standardized Endpoints 422 to linked field errors and preserves input", async () => {
		saveDraftMock.mockRejectedValueOnce(
			new HttpRequestError({
				code: "validation_error",
				details: [
					{
						input: "invalid-endpoint-value",
						loc: ["body", "registrationAnswers", "applicationEnvironmentUrlEn"],
						msg: "Input should be a valid URL",
						type: "url_parsing",
					},
				],
				requestId: "registration-endpoints-422",
				status: 422,
			})
		);
		render(<WorkspaceRPRegistrationStepPage />);
		fireEvent.click(screen.getByRole("button", { name: "Fill Endpoints" }));
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));

		const fieldLink = await screen.findByRole("link", {
			name: "Check this answer.",
		});
		expect(fieldLink.getAttribute("href")).toBe(
			"#workspace-rp-application-url-en"
		);
		expect(screen.getByTestId("field-errors").textContent).toContain(
			'"applicationEnvironmentUrlEn":"Check this answer."'
		);
		expect(screen.getByTestId("form-values").textContent).toContain(
			'"applicationEnvironmentUrlEn":"https://benefits.canada.ca"'
		);
		expect(
			screen.queryByRole("heading", { name: "Unable to load registration" })
		).toBeNull();
		expect(navigateMock).not.toHaveBeenCalled();
	});

	it("retries a failed save with the same versioned input instead of reloading", async () => {
		saveDraftMock
			.mockRejectedValueOnce(new Error("network unavailable"))
			.mockResolvedValueOnce({
				onboardingState: "draft",
				registrationAnswers: {},
				registrationDraftVersion: 3,
				registrationLastCompletedStep: "endpoints",
				rpApplicationUuid: "rp-1",
				workspaceUuid: "workspace-1",
			});
		render(<WorkspaceRPRegistrationStepPage />);
		fireEvent.click(screen.getByRole("button", { name: "Fill Endpoints" }));
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));

		fireEvent.click(
			await screen.findByRole("button", { name: "Try saving again" })
		);
		await waitFor(() => expect(saveDraftMock).toHaveBeenCalledTimes(2));
		expect(saveDraftMock.mock.calls[1]?.[2]).toEqual(
			saveDraftMock.mock.calls[0]?.[2]
		);
		await waitFor(() => expect(navigateMock).toHaveBeenCalledTimes(1));
	});

	it("reloads a conflict, rebases the draft version, and retains entered answers", async () => {
		saveDraftMock
			.mockRejectedValueOnce(
				new ConflictRequestError({
					code: "registration_draft_version_conflict",
					requestId: "registration-conflict",
				})
			)
			.mockResolvedValueOnce({
				onboardingState: "draft",
				registrationAnswers: {},
				registrationDraftVersion: 5,
				registrationLastCompletedStep: "endpoints",
				rpApplicationUuid: "rp-1",
				workspaceUuid: "workspace-1",
			});
		const refreshedDraft = {
			onboardingState: "draft" as const,
			registrationAnswers: {
				canadaLoginEnvironment: "test" as const,
				serviceNameEn: "Benefits Portal",
				serviceNameFr: "Portail des prestations",
			},
			registrationDraftVersion: 4,
			registrationLastCompletedStep: "basics" as const,
			rpApplicationUuid: "rp-1",
			workspaceUuid: "workspace-1",
		};
		const refetch = vi.fn(async () => {
			vi.mocked(useWorkspaceRPRegistrationDraft).mockReturnValue({
				draft: refreshedDraft,
				error: null,
				isLoading: false,
				refetch,
			});
			return refreshedDraft;
		});
		vi.mocked(useWorkspaceRPRegistrationDraft).mockReturnValue({
			draft: endpointsDraft,
			error: null,
			isLoading: false,
			refetch,
		});

		render(<WorkspaceRPRegistrationStepPage />);
		fireEvent.click(screen.getByRole("button", { name: "Fill Endpoints" }));
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));
		fireEvent.click(
			await screen.findByRole("button", { name: "Reload draft" })
		);

		await waitFor(() =>
			expect(screen.getByTestId("form-values").textContent).toContain(
				'"applicationEnvironmentUrlEn":"https://benefits.canada.ca"'
			)
		);
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));
		await waitFor(() => expect(saveDraftMock).toHaveBeenCalledTimes(2));
		expect(saveDraftMock.mock.calls[1]?.[2].expectedDraftVersion).toBe(4);
	});

	it("reviews a complete draft and performs one versioned final submission", async () => {
		route.step = "review";
		vi.mocked(useWorkspaceRPRegistrationDraft).mockReturnValue({
			draft: {
				onboardingState: "draft",
				registrationAnswers: completeAnswers,
				registrationDraftVersion: 6,
				registrationLastCompletedStep: "encryption",
				rpApplicationUuid: "rp-1",
				workspaceUuid: "workspace-1",
			},
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
		});

		render(<WorkspaceRPRegistrationStepPage />);
		fireEvent.click(
			screen.getByRole("button", { name: "Submit registration" })
		);
		await waitFor(() =>
			expect(submitMock).toHaveBeenCalledWith("workspace-1", "rp-1", 6)
		);
		await waitFor(() =>
			expect(navigateMock).toHaveBeenCalledWith({
				href: "/workspaces/workspace-1/applications/rp-1/registration/confirmation",
				replace: true,
			})
		);
	});

	it("warns before discarding unsaved current-step changes", async () => {
		const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(false);
		render(<WorkspaceRPRegistrationStepPage />);

		fireEvent.click(screen.getByRole("button", { name: "Fill Endpoints" }));
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

		expect(confirmMock).toHaveBeenCalledWith("Leave without saving?");
		expect(navigateMock).not.toHaveBeenCalled();

		confirmMock.mockReturnValue(true);
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		await waitFor(() =>
			expect(navigateMock).toHaveBeenCalledWith({
				href: "/workspaces/workspace-1/applications/rp-1",
			})
		);
	});

	it("moves Back without discarding current recoverable input", async () => {
		const confirmMock = vi.spyOn(window, "confirm");
		render(<WorkspaceRPRegistrationStepPage />);
		fireEvent.click(screen.getByRole("button", { name: "Fill Endpoints" }));
		fireEvent.click(screen.getByRole("button", { name: "Back" }));

		expect(confirmMock).not.toHaveBeenCalled();
		await waitFor(() =>
			expect(navigateMock).toHaveBeenCalledWith({
				href: "/workspaces/workspace-1/applications/rp-1/registration/basics",
			})
		);
	});

	it("recovers a direct future-step route to the earliest incomplete step", async () => {
		route.step = "signing";
		render(<WorkspaceRPRegistrationStepPage />);

		await waitFor(() =>
			expect(navigateMock).toHaveBeenCalledWith({
				href: "/workspaces/workspace-1/applications/rp-1/registration/endpoints",
				replace: true,
			})
		);
	});

	it("offers a retry without claiming a failed draft load succeeded", () => {
		const refetch = vi.fn(async () => null);
		vi.mocked(useWorkspaceRPRegistrationDraft).mockReturnValue({
			draft: null,
			error: new Error("network unavailable"),
			isLoading: false,
			refetch,
		});
		render(<WorkspaceRPRegistrationStepPage />);
		fireEvent.click(screen.getByRole("button", { name: "Try loading again" }));

		expect(refetch).toHaveBeenCalledTimes(1);
		expect(saveDraftMock).not.toHaveBeenCalled();
	});
});
