import type { PropsWithChildren, ReactElement, ReactNode } from "react";
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceRPRegistrationStepPage } from "@/features/workspaces/pages/WorkspaceRPRegistrationStepPage";
import { useWorkspaceApplicationInformationList } from "@/features/workspaces/hooks/use-workspace-application-information";
import {
	useWorkspaceRPRegistrationActions,
	useWorkspaceRPRegistrationDraft,
} from "@/features/workspaces/hooks/use-workspace-rp-registration";
import type { WorkspaceRPApplicationRegistrationDraftPatch } from "@/fetch/rp-applications";
import { ConflictRequestError, HttpRequestError } from "@/fetch";
import { clearPendingRegistrationValidation } from "@/features/workspaces/registration-validation-recovery";

const route: {
	applicationInformationUuid?: string;
	rpApplicationUuid?: string;
	rpConfigurationUuid?: string;
	step: string;
	workspaceUuid: string;
} = {
	step: "endpoints",
	workspaceUuid: "workspace-1",
	rpApplicationUuid: "rp-1",
};
const blockerState: {
	options: null | {
		disabled?: boolean;
		enableBeforeUnload?: boolean | (() => boolean);
		shouldBlockFn: () => boolean | Promise<boolean>;
	};
} = { options: null };
const navigateMock = vi.fn((_options?: Record<string, unknown>) =>
	Promise.resolve()
);
const navigateThroughBlockerMock = async (
	options: Record<string, unknown>
): Promise<void> => {
	if (
		blockerState.options &&
		!blockerState.options.disabled &&
		(await blockerState.options.shouldBlockFn())
	) {
		return;
	}
	await navigateMock(options);
};
const saveDraftMock = vi.fn(
	(
		_workspaceUuid: string,
		_rpApplicationUuid: string,
		_payload: WorkspaceRPApplicationRegistrationDraftPatch
	) =>
		Promise.resolve({
			applicationInformationUuid: "application-information-1",
			configurationName: "Test integration A",
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
		t: (key: string, options?: Record<string, unknown>): string => {
			const translated =
				{
					"workspaces.applicationsUrlEnLabel": "Application URL (English)",
					"workspaces.applicationsUrlFrLabel": "Application URL (French)",
					"workspaces.applicationsRedirectUrisLabel": "Redirect URIs",
					"workspaces.applicationsLogoutModeLabel": "Logout mode",
					"workspaces.applicationsLogoutUriLabel": "Logout URI",
					"workspaces.applicationsConfigurationNameLabel":
						"RP configuration name",
					"workspaces.applicationsRequestedScopesLabel": "Requested scopes",
					"workspaces.applicationsRequestEncryptionSupportedLabel":
						"Supports request encryption to CanadaLogin",
					"workspaces.applicationsRequestSigningSupportedLabel":
						"Supports signing messages sent to CanadaLogin",
					"workspaces.applicationsRequestSigningTargetsLabel":
						"Request-signing targets",
					"workspaces.applicationsSignatureAlgorithmsLabel":
						"Supported signature algorithms",
					"workspaces.applicationsValidationRequestSigningDetailsRequired":
						"Complete the request-signing targets and algorithm details when request signing is supported.",
					"workspaces.applicationsSavingAction": "Saving...",
					"workspaces.registration.continueAction": "Continue",
					"workspaces.registration.currentStepStatus": "Current step",
					"workspaces.registration.conflictErrorBody":
						"Reload the latest draft without losing entered answers.",
					"workspaces.registration.conflictErrorTitle":
						"Registration draft changed",
					"workspaces.registration.discardChangesWarning":
						"Leave without saving?",
					"workspaces.registration.fieldValidationMessage":
						"{{field}}: {{message}}",
					"workspaces.registration.loadErrorBody": "Try loading it again.",
					"workspaces.registration.loadErrorTitle":
						"Unable to load registration",
					"workspaces.registration.needsAttentionStatus":
						"Needs attention before submission",
					"workspaces.registration.reloadAction": "Reload draft",
					"workspaces.registration.retryAction": "Try again",
					"workspaces.registration.retryLoadAction": "Try loading again",
					"workspaces.registration.retrySaveAction": "Try saving again",
					"workspaces.registration.requiredFieldMessage":
						"Enter or select an answer for {{field}}.",
					"workspaces.registration.saveAndExitAction": "Save and exit",
					"workspaces.registration.saveErrorBody":
						"Your answers remain on this page.",
					"workspaces.registration.saveErrorTitle":
						"Unable to save registration",
					"workspaces.registration.submitAction": "Submit registration",
					"workspaces.registration.steps.endpoints": "Endpoints",
					"workspaces.registration.steps.basics": "Basics",
					"workspaces.registration.steps.clientAndAccess": "Client and access",
					"workspaces.registration.steps.encryption": "Encryption",
					"workspaces.registration.steps.review": "Review",
					"workspaces.registration.steps.signing": "Signing",
					"workspaces.registration.stepsNavigationTitle": "Registration steps",
					"workspaces.registration.unavailableStepStatus": "Not available yet",
					"workspaces.registration.validationFieldMessage":
						"Review the answer for {{field}}.",
					"workspaces.registration.validationGeneralMessage":
						"Check the answers on this step.",
					"workspaces.registration.validationSummaryHeading":
						"The registration could not be saved",
				}[key] ?? key;
			return translated.replace(/\{\{(\w+)\}\}/g, (_match, name: string) =>
				String(options?.[name] ?? `{{${name}}}`)
			);
		},
	}),
}));
vi.mock("@tanstack/react-router", () => ({
	useBlocker: (options: typeof blockerState.options): void => {
		blockerState.options = options;
	},
	useNavigate: () => navigateThroughBlockerMock,
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
	Heading: ({
		children,
		id,
		tag = "h1",
	}: PropsWithChildren<{ id?: string; tag?: "h1" | "h2" }>): ReactElement => {
		const Tag = tag;
		return <Tag id={id}>{children}</Tag>;
	},
	Link: ({
		children,
		href,
		onGcdsClick,
	}: PropsWithChildren<{
		href: string;
		onGcdsClick?: (event: Event) => void;
	}>): ReactElement => (
		<a href={href} onClick={(event) => onGcdsClick?.(event.nativeEvent)}>
			{children}
		</a>
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
	Stepper: ({
		children,
		currentStep,
		totalSteps,
	}: PropsWithChildren<{
		currentStep: number;
		totalSteps: number;
	}>): ReactElement => (
		<p data-testid="registration-stepper">
			Step {currentStep} of {totalSteps}: {children}
		</p>
	),
}));
vi.mock("@/features/workspaces/components/WorkspaceRPApplicationForm", () => ({
	WorkspaceRPApplicationForm: ({
		applicationContextName,
		errorSummary,
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
		applicationContextName?: string;
		errorSummary?: ReactNode;
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
			{errorSummary}
			{applicationContextName ? (
				<p>Application: {applicationContextName}</p>
			) : null}
			<output data-testid="field-errors">{JSON.stringify(fieldErrors)}</output>
			<output data-testid="form-values">{JSON.stringify(form)}</output>
			<button
				type="button"
				onClick={() => {
					onChange("configurationName", "Partner staging B");
					onChange("partnerEnvironment", "Partner staging");
					onChange("canadaLoginEnvironment", "staging");
				}}
			>
				Fill Basics
			</button>
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
			<button
				type="button"
				onClick={() =>
					onChange("applicationEnvironmentUrlEn", "https://benefits.canada.ca")
				}
			>
				Correct English URL
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
	applicationInformationUuid: "application-information-1",
	configurationName: "Test integration A",
	onboardingState: "draft" as const,
	partnerEnvironment: "Partner test",
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
		clearPendingRegistrationValidation("workspace-1:rp-1");
		blockerState.options = null;
		route.step = "endpoints";
		route.applicationInformationUuid = "application-information-1";
		route.rpConfigurationUuid = "rp-1";
		delete route.rpApplicationUuid;
		vi.mocked(useWorkspaceApplicationInformationList).mockReturnValue({
			applicationInformationRecords: [],
			error: null,
			isLoading: false,
			refetch: vi.fn(),
		});
		vi.mocked(useWorkspaceRPRegistrationActions).mockReturnValue({
			createApplicationDraft: vi.fn(),
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
				href: "/workspaces/workspace-1/applications/application-information-1/rp-configurations/rp-1/registration/client-and-access",
			})
		);
	});

	it("updates nested Basics using configuration identity and parent Application names", async () => {
		route.step = "basics";
		route.applicationInformationUuid = "application-information-1";
		route.rpConfigurationUuid = "rp-1";
		delete route.rpApplicationUuid;
		vi.mocked(useWorkspaceApplicationInformationList).mockReturnValue({
			applicationInformationRecords: [
				{
					serviceNameEn: "Current Benefits Portal",
					serviceNameFr: "Portail actuel des prestations",
					uuid: "application-information-1",
				} as never,
			],
			error: null,
			isLoading: false,
			refetch: vi.fn(),
		});

		render(<WorkspaceRPRegistrationStepPage />);

		expect(
			screen.getByText("Application: Current Benefits Portal")
		).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Fill Basics" }));
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));

		await waitFor(() => expect(saveDraftMock).toHaveBeenCalled());
		expect(saveDraftMock).toHaveBeenCalledWith(
			"workspace-1",
			"rp-1",
			expect.objectContaining({
				configurationName: "Partner staging B",
				partnerEnvironment: "Partner staging",
				registrationAnswers: expect.objectContaining({
					canadaLoginEnvironment: "staging",
					serviceNameEn: "Current Benefits Portal",
					serviceNameFr: "Portail actuel des prestations",
				}),
				stepId: "basics",
			}),
			"application-information-1"
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
				name: /Enter or select an answer for/,
			}).length
		).toBeGreaterThan(0);
		expect(screen.getByTestId("field-errors").textContent).toContain(
			"applicationEnvironmentUrlEn"
		);
		expect(saveDraftMock).not.toHaveBeenCalled();
	});

	it("renders all six labels with completed, current, and blocked semantics", () => {
		render(<WorkspaceRPRegistrationStepPage />);

		const navigation = screen.getByRole("navigation", {
			name: "Registration steps",
		});
		expect(within(navigation).getAllByRole("listitem")).toHaveLength(6);
		expect(
			within(navigation)
				.getByRole("link", { name: "Basics" })
				.getAttribute("href")
		).toContain("/registration/basics");
		expect(
			navigation.querySelector("[aria-current='step']")?.textContent
		).toContain("Endpoints");
		expect(
			within(navigation).queryByRole("link", { name: "Client and access" })
		).toBeNull();
		expect(navigation.textContent).toContain("Not available yet");
		expect(screen.getByTestId("registration-stepper").textContent).toContain(
			"Step 2 of 6"
		);
	});

	it("uses completed-step links for navigation only and protects dirty input", async () => {
		const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(false);
		render(<WorkspaceRPRegistrationStepPage />);
		fireEvent.click(screen.getByRole("button", { name: "Fill Endpoints" }));
		fireEvent.click(screen.getByRole("link", { name: "Basics" }));

		expect(confirmMock).toHaveBeenCalledWith("Leave without saving?");
		expect(navigateMock).not.toHaveBeenCalled();
		expect(saveDraftMock).not.toHaveBeenCalled();

		confirmMock.mockReturnValue(true);
		fireEvent.click(screen.getByRole("link", { name: "Basics" }));
		await waitFor(() =>
			expect(navigateMock).toHaveBeenCalledWith({
				href: "/workspaces/workspace-1/applications/application-information-1/rp-configurations/rp-1/registration/basics",
			})
		);
		expect(saveDraftMock).not.toHaveBeenCalled();
	});

	it("enables native exit protection only while the current step is dirty", () => {
		render(<WorkspaceRPRegistrationStepPage />);
		const enableBeforeUnload = blockerState.options?.enableBeforeUnload;
		expect(typeof enableBeforeUnload).toBe("function");
		expect((enableBeforeUnload as () => boolean)()).toBe(false);

		fireEvent.click(screen.getByRole("button", { name: "Fill Endpoints" }));

		expect(
			(blockerState.options?.enableBeforeUnload as () => boolean)()
		).toBe(true);
	});

	it("clears only client errors resolved by the edited answer", () => {
		render(<WorkspaceRPRegistrationStepPage />);
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));

		expect(screen.getByTestId("field-errors").textContent).toContain(
			"applicationEnvironmentUrlEn"
		);
		expect(screen.getByTestId("field-errors").textContent).toContain(
			"applicationEnvironmentUrlFr"
		);

		fireEvent.click(
			screen.getByRole("button", { name: "Correct English URL" })
		);

		expect(screen.getByTestId("field-errors").textContent).not.toContain(
			"applicationEnvironmentUrlEn"
		);
		expect(screen.getByTestId("field-errors").textContent).toContain(
			"applicationEnvironmentUrlFr"
		);
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
			name: "Review the answer for Application URL (English).",
		});
		expect(fieldLink.getAttribute("href")).toBe(
			"#workspace-rp-application-url-en"
		);
		expect(screen.getByTestId("field-errors").textContent).toContain(
			'"applicationEnvironmentUrlEn":"Review the answer for Application URL (English)."'
		);
		expect(screen.getByTestId("form-values").textContent).toContain(
			'"applicationEnvironmentUrlEn":"https://benefits.canada.ca"'
		);
		expect(
			screen.queryByRole("heading", { name: "Unable to load registration" })
		).toBeNull();
		expect(navigateMock).not.toHaveBeenCalled();
	});

	it("maps a standardized 422 to a linked choice group on another step", async () => {
		route.step = "signing";
		vi.mocked(useWorkspaceRPRegistrationDraft).mockReturnValue({
			draft: {
				...endpointsDraft,
				registrationAnswers: completeAnswers,
				registrationLastCompletedStep: "client-and-access",
			},
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
		});
		saveDraftMock.mockRejectedValueOnce(
			new HttpRequestError({
				code: "validation_error",
				details: [
					{
						loc: ["body", "registrationAnswers", "requestSigningSupported"],
						msg: "Invalid signing answer",
						type: "value_error",
					},
				],
				requestId: "registration-signing-422",
				status: 422,
			})
		);

		render(<WorkspaceRPRegistrationStepPage />);
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));

		const fieldLink = await screen.findByRole("link", {
			name: "Review the answer for Supports signing messages sent to CanadaLogin.",
		});
		expect(fieldLink.getAttribute("href")).toBe("#requestSigningSupported");
		expect(screen.getByTestId("field-errors").textContent).toContain(
			"requestSigningSupported"
		);
	});

	it.each([
		{
			field: "configurationName",
			label: "RP configuration name",
			lastCompletedStep: null,
			step: "basics",
			target: "workspace-rp-application-configuration-name",
		},
		{
			field: "requestedScopes",
			label: "Requested scopes",
			lastCompletedStep: "endpoints",
			step: "client-and-access",
			target: "requestedScopes",
		},
		{
			field: "requestEncryptionSupported",
			label: "Supports request encryption to CanadaLogin",
			lastCompletedStep: "signing",
			step: "encryption",
			target: "requestEncryptionSupported",
		},
	] as const)(
		"maps a $step server error to its ordered question target",
		async ({ field, label, lastCompletedStep, step: targetStep, target }) => {
			route.step = targetStep;
			vi.mocked(useWorkspaceRPRegistrationDraft).mockReturnValue({
				draft: {
					...endpointsDraft,
					registrationAnswers: completeAnswers,
					registrationLastCompletedStep: lastCompletedStep,
				},
				error: null,
				isLoading: false,
				refetch: vi.fn(async () => null),
			});
			saveDraftMock.mockRejectedValueOnce(
				new HttpRequestError({
					code: "validation_error",
					details: [
						{
							loc:
								targetStep === "basics"
									? ["body", field]
									: ["body", "registrationAnswers", field],
							msg: "Invalid answer",
							type: "value_error",
						},
					],
					requestId: `registration-${targetStep}-422`,
					status: 422,
				})
			);

			render(<WorkspaceRPRegistrationStepPage />);
			fireEvent.click(screen.getByRole("button", { name: "Continue" }));

			const fieldLink = await screen.findByRole("link", {
				name: `Review the answer for ${label}.`,
			});
			expect(fieldLink.getAttribute("href")).toBe(`#${target}`);
			expect(screen.getByTestId("field-errors").textContent).toContain(field);
		}
	);

	it("keeps a fieldless 422 separate from question feedback", async () => {
		saveDraftMock.mockRejectedValueOnce(
			new HttpRequestError({
				code: "validation_error",
				details: [
					{
						loc: ["body", "expectedDraftVersion"],
						msg: "Version is invalid",
						type: "value_error",
					},
				],
				requestId: "registration-fieldless-422",
				status: 422,
			})
		);
		render(<WorkspaceRPRegistrationStepPage />);
		fireEvent.click(screen.getByRole("button", { name: "Fill Endpoints" }));
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));

		expect(
			await screen.findByRole("heading", {
				name: "Unable to save registration",
			})
		).toBeTruthy();
		expect(
			screen.queryByRole("alert", {
				name: "The registration could not be saved",
			})
		).toBeNull();
	});

	it("retries a failed save with the same versioned input instead of reloading", async () => {
		saveDraftMock
			.mockRejectedValueOnce(new Error("network unavailable"))
			.mockResolvedValueOnce({
				applicationInformationUuid: "application-information-1",
				configurationName: "Test integration A",
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
				applicationInformationUuid: "application-information-1",
				configurationName: "Test integration A",
				onboardingState: "draft",
				registrationAnswers: {},
				registrationDraftVersion: 5,
				registrationLastCompletedStep: "endpoints",
				rpApplicationUuid: "rp-1",
				workspaceUuid: "workspace-1",
			});
		const refreshedDraft = {
			applicationInformationUuid: "application-information-1",
			configurationName: "Test integration A",
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
				applicationInformationUuid: "application-information-1",
				configurationName: "Test integration A",
				onboardingState: "draft",
				partnerEnvironment: "Partner test",
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
			expect(submitMock).toHaveBeenCalledWith(
				"workspace-1",
				"rp-1",
				6,
				"application-information-1"
			)
		);
		await waitFor(() =>
			expect(navigateMock).toHaveBeenCalledWith({
				href: "/workspaces/workspace-1/applications/application-information-1/rp-configurations/rp-1/registration/confirmation",
				replace: true,
			})
		);
	});

	it("recovers Review errors on the earliest route without cross-route links", async () => {
		route.step = "review";
		const invalidReviewDraft = {
			applicationInformationUuid: "application-information-1",
			configurationName: "Test integration A",
			onboardingState: "draft" as const,
			partnerEnvironment: "Partner test",
			registrationAnswers: {
				...completeAnswers,
				messageDecryptionSupported: true,
				messageDecryptionTargets: [],
				requestSigningAlgorithms: [],
				requestSigningSupported: true,
				requestSigningTargets: [],
			},
			registrationDraftVersion: 6,
			registrationLastCompletedStep: "encryption" as const,
			rpApplicationUuid: "rp-1",
			workspaceUuid: "workspace-1",
		};
		vi.mocked(useWorkspaceRPRegistrationDraft).mockReturnValue({
			draft: invalidReviewDraft,
			error: null,
			isLoading: false,
			refetch: vi.fn(async () => null),
		});

		const firstRender = render(<WorkspaceRPRegistrationStepPage />);
		fireEvent.click(
			screen.getByRole("button", { name: "Submit registration" })
		);
		await waitFor(() =>
			expect(navigateMock).toHaveBeenCalledWith({
				href: "/workspaces/workspace-1/applications/application-information-1/rp-configurations/rp-1/registration/signing",
				replace: true,
			})
		);
		expect(submitMock).not.toHaveBeenCalled();

		firstRender.unmount();
		route.step = "signing";
		navigateMock.mockClear();
		render(<WorkspaceRPRegistrationStepPage />);

		const summary = await screen.findByRole("alert", {
			name: "The registration could not be saved",
		});
		expect(
			within(summary)
				.getByRole("link", {
					name: /Request-signing targets:/,
				})
				.getAttribute("href")
		).toBe("#requestSigningTargets");
		expect(
			summary.querySelector("a[href='#messageDecryptionTargets']")
		).toBeNull();
		expect(
			screen.getByRole("navigation", { name: "Registration steps" }).textContent
		).toContain("Needs attention before submission");
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
				href: "/workspaces/workspace-1/applications/application-information-1/rp-configurations/rp-1",
			})
		);
	});

	it("warns before Back can discard current input", async () => {
		const confirmMock = vi.spyOn(window, "confirm").mockReturnValue(false);
		render(<WorkspaceRPRegistrationStepPage />);
		fireEvent.click(screen.getByRole("button", { name: "Fill Endpoints" }));
		fireEvent.click(screen.getByRole("button", { name: "Back" }));

		expect(confirmMock).toHaveBeenCalledWith("Leave without saving?");
		expect(navigateMock).not.toHaveBeenCalled();
		confirmMock.mockReturnValue(true);
		fireEvent.click(screen.getByRole("button", { name: "Back" }));
		await waitFor(() =>
			expect(navigateMock).toHaveBeenLastCalledWith({
				href: "/workspaces/workspace-1/applications/application-information-1/rp-configurations/rp-1/registration/basics",
			})
		);
	});

	it("recovers a direct future-step route to the earliest incomplete step", async () => {
		route.step = "signing";
		render(<WorkspaceRPRegistrationStepPage />);

		await waitFor(() =>
			expect(navigateMock).toHaveBeenCalledWith({
				href: "/workspaces/workspace-1/applications/application-information-1/rp-configurations/rp-1/registration/endpoints",
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
