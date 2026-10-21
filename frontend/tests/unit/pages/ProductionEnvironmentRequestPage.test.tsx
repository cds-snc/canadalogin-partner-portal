import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductionEnvironmentRequestPage } from "@/features/application-environments/pages/ProductionEnvironmentRequestPage";

const {
	mockedCreateEnvironment,
	mockedNavigate,
	mockedUseApplicationEnvironment,
	mockedUseApplicationEnvironments,
} = vi.hoisted(() => ({
	mockedCreateEnvironment: vi.fn(),
	mockedNavigate: vi.fn(),
	mockedUseApplicationEnvironment: vi.fn(),
	mockedUseApplicationEnvironments: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockedNavigate,
	useParams: () => ({
		applicationUuid: "application-uuid-1",
		environmentUuid: "environment-uuid-1",
	}),
}));

vi.mock("@gcds-core/components-react", () => ({
	GcdsHint: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
	GcdsLabel: ({
		label,
		labelFor,
	}: {
		label: string;
		labelFor: string;
	}): ReactElement => <label htmlFor={labelFor}>{label}</label>,
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { resolvedLanguage: "en" },
			t: (key: string, options?: { count?: number; field?: string }): string => {
			const translations: Record<string, string> = {
				"applicationEnvironmentConnect.applicationNameFallback":
					"this application",
				"applicationEnvironmentConnect.backChannel": "Back-channel",
				"applicationEnvironmentConnect.clientSecretBasic":
					"Client secret basic",
				"applicationEnvironmentConnect.clientSecretPost":
					"Client secret post",
				"applicationEnvironmentConnect.confidentialClient":
					"Confidential client",
				"applicationEnvironmentConnect.frontChannel": "Front-channel",
				"applicationEnvironmentConnect.idToken": "ID token",
				"applicationEnvironmentConnect.stepOne.applicationUrlEn":
					"English environment URL",
				"applicationEnvironmentConnect.stepOne.applicationUrlFr":
					"French environment URL",
				"applicationEnvironmentConnect.stepOne.applicationUrlFrHint":
					"If both language versions use the same URL, enter it again.",
				"applicationEnvironmentConnect.stepOne.authorizationCodeFlow":
					"authorization code flow",
				"applicationEnvironmentConnect.stepOne.environmentName":
					"Environment name",
				"applicationEnvironmentConnect.stepOne.environmentNameHint":
					"Use letters, numbers and hyphens only.",
				"applicationEnvironmentConnect.stepOne.verificationRequirement":
					"verifying messages from CanadaLogin",
				"applicationEnvironmentConnect.stepFour.canDecryptMessages":
					"Can your environment decrypt messages?",
				"applicationEnvironmentConnect.stepFour.canEncryptRequests":
					"Can your environment encrypt requests?",
				"applicationEnvironmentConnect.stepFour.canSignMessages":
					"Can your environment sign messages?",
				"applicationEnvironmentConnect.stepFour.decryptionTitle":
					"Decrypt messages from CanadaLogin",
				"applicationEnvironmentConnect.stepFour.encryptionTitle":
					"Encrypt requests sent to CanadaLogin",
				"applicationEnvironmentConnect.stepFour.intro":
					"Configure message security.",
				"applicationEnvironmentConnect.stepFour.messageSecurity":
					"message security",
				"applicationEnvironmentConnect.stepFour.mustVerify":
					"Learn more about",
				"applicationEnvironmentConnect.stepFour.signingTitle":
					"Sign messages sent to CanadaLogin",
				"applicationEnvironmentConnect.stepFour.verificationAlgorithms":
					"Verification algorithms",
				"applicationEnvironmentConnect.stepFour.verificationMessages":
					"Which messages can your environment verify?",
				"applicationEnvironmentConnect.stepFour.verificationRequirement":
					"Your environment must verify messages.",
				"applicationEnvironmentConnect.stepFour.verificationTitle":
					"Verify messages from CanadaLogin",
				"applicationEnvironmentConnect.stepFour.title": "Security",
				"applicationEnvironmentConnect.stepThree.authenticationLink":
					"authentication with CanadaLogin",
				"applicationEnvironmentConnect.stepThree.clientAuthMethod":
					"Client authentication method",
				"applicationEnvironmentConnect.stepThree.clientSecretBasicHint":
					"Sends the client ID and secret in the authorization header.",
				"applicationEnvironmentConnect.stepThree.clientSecretPostHint":
					"Sends the client ID and secret in the request body.",
				"applicationEnvironmentConnect.stepThree.clientType": "Client type",
				"applicationEnvironmentConnect.stepThree.confidentialClientHint":
					"Can securely store client credentials.",
				"applicationEnvironmentConnect.stepThree.intro":
					"Choose authentication.",
				"applicationEnvironmentConnect.stepThree.jwksUri": "JWKS URI",
				"applicationEnvironmentConnect.stepThree.jwksUriHint":
					"The JWKS URI.",
				"applicationEnvironmentConnect.stepThree.learnMorePrefix":
					"Learn more about the",
				"applicationEnvironmentConnect.stepThree.pkceHint":
					"PKCE hint",
				"applicationEnvironmentConnect.stepThree.pkceSupported":
					"Does your environment support PKCE?",
				"applicationEnvironmentConnect.stepThree.privateKeyJwtHint":
					"Uses a signed JWT.",
				"applicationEnvironmentConnect.stepThree.title": "Authentication",
				"applicationEnvironmentConnect.publicClient": "Public client",
				"applicationEnvironmentConnect.privateKeyJwt": "Private key JWT",
				"applicationEnvironmentConnect.requestObject": "Request object",
				"applicationEnvironmentConnect.signingAlgorithms": "Signing algorithms",
				"applicationEnvironmentConnect.stepTwo.addPostLogoutRedirectUri":
					"Add post logout URL",
				"applicationEnvironmentConnect.stepTwo.addRedirectUri":
					"Add redirect URL",
				"applicationEnvironmentConnect.stepTwo.intro":
					"Add the URLs CanadaLogin needs.",
				"applicationEnvironmentConnect.stepTwo.logoutMethod": "Logout method",
				"applicationEnvironmentConnect.stepTwo.postLogoutUrl":
					"Post logout URL",
				"applicationEnvironmentConnect.stepTwo.postLogoutUrlsHint":
					"Where CanadaLogin can send users after they sign out.",
				"applicationEnvironmentConnect.stepTwo.postLogoutUrlsTitle":
					"Post logout URLs",
				"applicationEnvironmentConnect.stepTwo.redirectUrl": "Redirect URL",
				"applicationEnvironmentConnect.stepTwo.redirectUrlsHint":
					"Where CanadaLogin can send authentication responses.",
				"applicationEnvironmentConnect.stepTwo.redirectUrlsTitle":
					"Redirect URLs",
				"applicationEnvironmentConnect.stepTwo.requirementsLink":
					"Learn more about connection requirements",
				"applicationEnvironmentConnect.stepTwo.signOutRequestUrl":
					"Sign-out request URL",
				"applicationEnvironmentConnect.stepTwo.title": "Connection",
				"applicationEnvironmentConnect.stepTwo.validationPostLogoutUrl":
					"Enter a valid post-logout URL.",
				"applicationEnvironmentConnect.stepTwo.validationRedirectUrl":
					"Enter a valid redirect URL.",
				"applicationEnvironmentConnect.stepTwo.validationSignOutRequestUrl":
					"Enter a valid sign-out request URL.",
				"applicationEnvironmentConnect.submitting": "Submitting...",
				"applicationEnvironmentConnect.switchApplication": "Switch application",
				"applicationEnvironmentConnect.tokenEndpoint": "Token endpoint",
				"applicationEnvironmentConnect.userinfo": "UserInfo endpoint",
				"applicationEnvironmentManagement.inactive": "Inactive",
				"applicationEnvironmentManagement.change": "Change",
				"applicationEnvironmentManagement.changeAccessible":
					"Change {{field}}",
				"applicationEnvironmentManagement.enabled": "Enabled",
				"applicationEnvironmentManagement.fields.authenticationMethod":
					"Client authentication method",
				"applicationEnvironmentManagement.fields.clientType": "Client type",
				"applicationEnvironmentManagement.fields.decryptionAlgorithms":
					"Decryption content algorithms",
				"applicationEnvironmentManagement.fields.decryptionKeyManagement":
					"Decryption key management",
				"applicationEnvironmentManagement.fields.englishUrl":
					"English environment URL",
				"applicationEnvironmentManagement.fields.environmentName":
					"Environment name",
				"applicationEnvironmentManagement.fields.productionStatus":
					"Production status",
				"applicationEnvironmentManagement.fields.environmentType":
					"Environment type",
				"applicationEnvironmentManagement.fields.encryptionAlgorithms":
					"Encryption content algorithms",
				"applicationEnvironmentManagement.fields.encryptionKeyManagement":
					"Encryption key management",
				"applicationEnvironmentManagement.fields.frenchUrl":
					"French environment URL",
				"applicationEnvironmentManagement.fields.jwksUri":
					"JSON Web Key Set (JWKS) URI",
				"applicationEnvironmentManagement.fields.messagesDecrypted":
					"Messages decrypted",
				"applicationEnvironmentManagement.fields.messagesSigned":
					"Messages signed",
				"applicationEnvironmentManagement.fields.messagesVerified":
					"Messages verified",
				"applicationEnvironmentManagement.fields.outboundIps":
					"Outbound IP addresses",
				"applicationEnvironmentManagement.fields.pkce":
					"Proof Key for Code Exchange (PKCE)",
				"applicationEnvironmentManagement.fields.postLogoutRedirectUris":
					"Post-logout redirect URIs",
				"applicationEnvironmentManagement.fields.redirectUris":
					"Redirect URIs",
				"applicationEnvironmentManagement.fields.requestsEncrypted":
					"Requests encrypted",
				"applicationEnvironmentManagement.fields.signOutRequestUrl":
					"Sign-out request URL",
				"applicationEnvironmentManagement.fields.signingAlgorithms":
					"Signing algorithms",
				"applicationEnvironmentManagement.fields.singleSignOutMethod":
					"Single sign-out method",
				"applicationEnvironmentManagement.fields.verificationAlgorithms":
					"Verification algorithms",
				"applicationEnvironmentManagement.sections.authentication":
					"Authentication",
				"applicationEnvironmentManagement.sections.connection": "Connection",
				"applicationEnvironmentManagement.sections.encryptionDecryption":
					"Encryption and decryption",
				"applicationEnvironmentManagement.sections.environment": "Environment",
				"applicationEnvironmentManagement.sections.verificationSigning":
					"Verification and signing",
				"applicationEnvironmentManagement.values.client_secret_basic":
					"Client secret basic",
				"applicationEnvironmentManagement.values.confidential":
					"Confidential",
				"applicationEnvironmentManagement.values.front_channel":
					"Front-channel",
				"applicationEnvironmentManagement.values.id_token": "ID token",
				"applicationEnvironmentManagement.values.RS256": "RS256",
				"applicationEnvironmentManagement.values.staging": "STAGING",
				"applicationEnvironmentManagement.values.submitted": "Requested",
				"applicationEnvironments.connect.validationEnvironmentName":
					"Enter a valid environment name.",
				"applicationEnvironments.connect.validationEnglishUrl":
					"Enter an English environment URL.",
				"applicationEnvironments.connect.validationFrenchUrl":
					"Enter a French environment URL.",
				"applicationEnvironmentProductionRequest.addOutboundIp":
					"Add outbound IP",
				"applicationEnvironmentProductionRequest.basedOnTitle":
					"Based on staging environment",
				"applicationEnvironmentProductionRequest.checkAnswersIntro":
					"Check the details before you request production. Some settings are based on your staging environment and cannot be changed.",
				"applicationEnvironmentProductionRequest.checkAnswersTitle":
					"Check your answers",
				"applicationEnvironmentProductionRequest.cancel": "Cancel",
				"applicationEnvironmentProductionRequest.continue": "Continue",
				"applicationEnvironmentProductionRequest.environmentType":
					"PRODUCTION",
				"applicationEnvironmentProductionRequest.ipAllowlistBody":
					"To ensure access we need the IP addresses your back-end services use to connect to CanadaLogin. We'll add them to an allowlist.",
				"applicationEnvironmentProductionRequest.outboundIp": "Outbound IP",
				"applicationEnvironmentProductionRequest.outboundIpsHint":
					"IP addresses your back-end services use to connect to CanadaLogin. We'll add them to an allowlist.",
				"applicationEnvironmentProductionRequest.outboundIpsTitle":
					"Outbound IPs",
				"applicationEnvironmentProductionRequest.validationOutboundIp":
					"Enter a valid IPv4 or IPv6 address.",
				"applicationEnvironmentProductionRequest.pkceRequirement":
					"Proof Key for Code Exchange (PKCE) for Public Clients",
				"applicationEnvironmentProductionRequest.requirementsIntro":
					"To connect this environment to CanadaLogin Production, it must support:",
				"applicationEnvironmentProductionRequest.requirementsLink":
					"Learn more about the requirements to use CanadaLogin",
				"applicationEnvironmentProductionRequest.stagingRequiredBody":
					"You can request a production environment only from a STAGING environment.",
				"applicationEnvironmentProductionRequest.stagingRequiredTitle":
					"STAGING environment required",
				"applicationEnvironmentProductionRequest.stagingSettingsBody":
					"Some settings are based on your staging environment and cannot be changed for production.",
				"applicationEnvironmentProductionRequest.submit":
					"Request production",
				"applicationEnvironmentProductionRequest.tokenAuthenticationMethod":
					"Token authentication method",
				"applicationEnvironmentProductionRequest.title":
					"Request a production environment",
				"common.back": "Back",
				"common.no": "No",
				"common.remove": "Remove",
				"common.yes": "Yes",
			};
			let value = translations[key] ?? key;
			if (options?.count) {
				value = `${value} ${options.count}`;
			}
			return value.replace("{{field}}", options?.field ?? "");
		},
	}),
}));

vi.mock("@/fetch", () => ({ getRequestErrorNotice: () => null }));

vi.mock(
	"@/features/application-environments/hooks/use-application-environment",
	() => ({ useApplicationEnvironment: mockedUseApplicationEnvironment })
);

vi.mock(
	"@/features/application-environments/hooks/use-application-environments",
	() => ({ useApplicationEnvironments: mockedUseApplicationEnvironments })
);

vi.mock(
	"@/features/application-environments/hooks/use-application-environment-management",
	() => ({
		useApplicationEnvironmentManagement: () => ({
			createEnvironment: mockedCreateEnvironment,
			error: null,
			isCreating: false,
		}),
	})
);

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		disabled,
		onGcdsClick,
		type,
	}: PropsWithChildren<{
		disabled?: boolean;
		onGcdsClick?: () => void;
		type?: "button" | "submit";
	}>): ReactElement => (
		<button disabled={disabled} type={type} onClick={onGcdsClick}>
			{children}
		</button>
	),
	Checkboxes: ({ legend }: { legend: string }): ReactElement => (
		<fieldset>
			<legend>{legend}</legend>
		</fieldset>
	),
	ErrorSummary: ({
		errorLinks,
	}: {
		errorLinks?: Record<string, string>;
	}): ReactElement => (
		<div data-testid="error-summary">
			{Object.values(errorLinks ?? {}).map((label) => (
				<span key={label}>{label}</span>
			))}
		</div>
	),
	Fieldset: ({
		children,
		hint,
		legend,
	}: PropsWithChildren<{ hint?: string; legend: string }>): ReactElement => (
		<fieldset>
			<legend>{legend}</legend>
			{hint && <div>{hint}</div>}
			{children}
		</fieldset>
	),
	Grid: ({ children }: PropsWithChildren): ReactElement => <div>{children}</div>,
	ConfigurationGrid: ({
		rows,
	}: {
		rows: Array<{
			edit?: ReactElement | null;
			field: ReactElement | string;
			value: ReactElement | string;
		}>;
	}): ReactElement => (
		<section>
			{rows.map((row, index) => (
				<div key={index}>
					<div>{row.field}</div>
					<div>{row.value}</div>
					<div>{row.edit}</div>
				</div>
			))}
		</section>
	),
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag: "h1" | "h2" }>): ReactElement => {
		const HeadingTag = tag;
		return <HeadingTag>{children}</HeadingTag>;
	},
	Icon: (): ReactElement => <span />,
	Input: ({
		errorMessage,
		id,
		inputId,
		label,
		name,
		onInput,
		value,
	}: {
		errorMessage?: string;
		id?: string;
		inputId: string;
		label: string;
		name: string;
		onInput?: React.FormEventHandler<Element>;
		value?: string;
	}): ReactElement => (
		<label data-error={errorMessage} id={id}>
			{label}
			<input id={inputId} name={name} value={value ?? ""} onInput={onInput} />
		</label>
	),
	Link: ({
		children,
		ariaLabel,
		href,
		onGcdsClick,
	}: PropsWithChildren<{
		ariaLabel?: string;
		href: string;
		onGcdsClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
	}>): ReactElement => (
		<a aria-label={ariaLabel} href={href} onClick={onGcdsClick}>
			{children}
		</a>
	),
	Notice: ({ children }: PropsWithChildren): ReactElement => <div>{children}</div>,
	Radios: ({
		legend,
		name,
		options,
		value,
		onInput,
	}: {
		legend: string;
		name: string;
		options: Array<{ id: string; label: string; value: string }>;
		value?: string;
		onInput?: React.FormEventHandler<Element>;
	}): ReactElement => (
		<fieldset>
			<legend>{legend}</legend>
			{options.map((option) => (
				<label key={option.id}>
					{option.label}
					<input
						checked={value === option.value}
						name={name}
						type="radio"
						value={option.value}
						onChange={() => undefined}
						onInput={onInput}
					/>
				</label>
			))}
		</fieldset>
	),
	SrOnly: ({ children }: PropsWithChildren): ReactElement => <span>{children}</span>,
	Stepper: ({ children }: PropsWithChildren): ReactElement => <div>{children}</div>,
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

const stagingEnvironment = {
	config: {
		applicationUrlEn: "https://staging.example.com/en",
		applicationUrlFr: "https://staging.example.com/fr",
		canDecryptMessages: false,
		canEncryptRequests: false,
		canSignMessages: false,
		clientType: "confidential" as const,
		clientAuthMethod: "client_secret_basic" as const,
		copyExisting: true,
		decryptionContentAlgorithms: [],
		decryptionKeyAlgorithms: [],
		decryptionMessages: [],
		encryptionContentAlgorithms: [],
		encryptionKeyAlgorithms: [],
		environmentName: "STAGING-portal",
		jwksUri: "",
		logoutMethod: "front_channel" as const,
		pkceSupported: true,
		postLogoutRedirectUris: ["https://staging.example.com/logout"],
		redirectUris: ["https://staging.example.com/callback"],
		signOutRequestUrl: "https://staging.example.com/signout",
		signingMessages: [],
		signingSignatureAlgorithms: [],
		singleSignOut: true,
		verificationMessages: ["id_token" as const],
		verificationSignatureAlgorithms: ["RS256" as const],
	},
	createdAt: "2026-09-17T00:00:00Z",
	partnerLabel: "STAGING-portal",
	statusCode: "submitted",
	tenantCode: "staging" as const,
	updatedAt: null,
	uuid: "environment-uuid-1",
};

beforeEach(() => {
	vi.clearAllMocks();
	mockedUseApplicationEnvironment.mockReturnValue({
		data: stagingEnvironment,
		error: null,
		isLoading: false,
	});
	mockedUseApplicationEnvironments.mockReturnValue({
		data: {
			application: {
				nameEn: "Benefits portal",
				nameFr: null,
				uuid: "application-uuid-1",
			},
		},
	});
	mockedCreateEnvironment.mockResolvedValue({ uuid: "production-uuid-1" });
});

const goToStepTwo = async (): Promise<void> => {
	fireEvent.input(await screen.findByDisplayValue("portal"), {
		target: { value: "portal-prod" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Continue" }));
	await waitFor(() => {
		expect(screen.getByText("Redirect URLs")).toBeTruthy();
	});
};

const goToStepThree = async (): Promise<void> => {
	await goToStepTwo();
	fireEvent.input(screen.getByLabelText("Outbound IP 1"), {
		target: { value: "192.0.2.10" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Continue" }));
	await waitFor(() => {
		expect(screen.getByText("Authentication")).toBeTruthy();
	});
};

const goToStepFour = async (): Promise<void> => {
	await goToStepThree();
	fireEvent.click(screen.getByRole("button", { name: "Continue" }));
	await waitFor(() => {
		expect(screen.getByText("Check your answers")).toBeTruthy();
	});
};

describe("ProductionEnvironmentRequestPage", () => {
	it("prefills STAGING values and keeps the request on the same route", async () => {
		render(<ProductionEnvironmentRequestPage />);

		expect(await screen.findByDisplayValue("portal")).toBeTruthy();
		expect(
			(screen.getByLabelText("English environment URL") as HTMLInputElement)
				.value
		).toBe("https://staging.example.com/en");
		expect(screen.getByText("Based on staging environment")).toBeTruthy();
		await goToStepTwo();
		expect(mockedNavigate).not.toHaveBeenCalled();
	});

	it("copies editable URL controls and renders logout method as display only", async () => {
		render(<ProductionEnvironmentRequestPage />);
		await goToStepTwo();

		expect(screen.getByDisplayValue("https://staging.example.com/callback")).toBeTruthy();
		expect(screen.getByDisplayValue("https://staging.example.com/logout")).toBeTruthy();
		expect(screen.getByDisplayValue("https://staging.example.com/signout")).toBeTruthy();
		expect(screen.getByText("Logout method")).toBeTruthy();
		expect(screen.getByText("Front-channel")).toBeTruthy();
		expect(screen.queryByRole("radio", { name: "Front-channel" })).toBeNull();
		expect(screen.getByText("Outbound IPs")).toBeTruthy();
		expect(
			screen.getByText(
				"IP addresses your back-end services use to connect to CanadaLogin. We'll add them to an allowlist."
			)
		).toBeTruthy();
	});

	it("supports outbound IP validation and repeatable rows", async () => {
		render(<ProductionEnvironmentRequestPage />);
		await goToStepTwo();

		fireEvent.click(screen.getByRole("button", { name: "Add outbound IP" }));
		expect(screen.getAllByLabelText(/Outbound IP/)).toHaveLength(2);
		fireEvent.input(screen.getByLabelText("Outbound IP 1"), {
			target: { value: "not-an-ip" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));
		await waitFor(() => {
			expect(screen.getByTestId("error-summary").textContent).toContain(
				"Enter a valid IPv4 or IPv6 address."
			);
		});
		fireEvent.input(screen.getByLabelText("Outbound IP 1"), {
			target: { value: "192.0.2.10" },
		});
		fireEvent.click(screen.getByRole("link", { name: "Remove" }));
		expect(screen.getAllByLabelText(/Outbound IP/)).toHaveLength(1);
	});

	it("preserves values when navigating back from authentication", async () => {
		render(<ProductionEnvironmentRequestPage />);
		await goToStepTwo();
		fireEvent.input(screen.getByLabelText("Outbound IP 1"), {
			target: { value: "192.0.2.10" },
		});
		fireEvent.input(screen.getByLabelText("Redirect URL 1"), {
			target: { value: "https://production.example.com/callback" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));
		await waitFor(() => {
			expect(screen.getByText("Authentication")).toBeTruthy();
		});
		fireEvent.click(screen.getByRole("button", { name: "Back" }));
		await waitFor(() => {
			expect(screen.getByDisplayValue("https://production.example.com/callback")).toBeTruthy();
		});
	});

	it("preserves outbound IPs when returning through the first step", async () => {
		render(<ProductionEnvironmentRequestPage />);
		await goToStepTwo();
		fireEvent.input(screen.getByLabelText("Outbound IP 1"), {
			target: { value: "192.0.2.10" },
		});

		fireEvent.click(screen.getByRole("button", { name: "Back" }));
		await waitFor(() => {
			expect(screen.getByDisplayValue("portal-prod")).toBeTruthy();
		});
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));
		await waitFor(() => {
			expect(screen.getByText("Redirect URLs")).toBeTruthy();
		});
		expect(screen.getByDisplayValue("192.0.2.10")).toBeTruthy();
	});

	it("preserves edited values when the environment data refreshes", async () => {
		render(<ProductionEnvironmentRequestPage />);
		await goToStepTwo();
		fireEvent.input(screen.getByLabelText("Outbound IP 1"), {
			target: { value: "192.0.2.10" },
		});

		mockedUseApplicationEnvironment.mockReturnValue({
			data: { ...stagingEnvironment, config: { ...stagingEnvironment.config } },
			error: null,
			isLoading: false,
		});
		fireEvent.click(screen.getByRole("button", { name: "Back" }));
		await waitFor(() => {
			expect(screen.getByDisplayValue("portal-prod")).toBeTruthy();
		});
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));
		await waitFor(() => {
			expect(screen.getByText("Redirect URLs")).toBeTruthy();
		});
		expect(screen.getByDisplayValue("192.0.2.10")).toBeTruthy();
	});

	it("renders staging authentication settings as read-only", async () => {
		render(<ProductionEnvironmentRequestPage />);
		await goToStepThree();

		expect(screen.queryByRole("radio")).toBeNull();
		expect(screen.getByText("Client type")).toBeTruthy();
		expect(screen.getByText("Confidential client")).toBeTruthy();
		expect(
			screen.getByText("Does your environment support PKCE?")
		).toBeTruthy();
		expect(screen.getByText("Yes")).toBeTruthy();
		expect(screen.getByText("Token authentication method")).toBeTruthy();
		expect(screen.getByText("Client secret basic")).toBeTruthy();
	});

	it("keeps JWKS editable for private key JWT authentication", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: {
				...stagingEnvironment,
				config: {
					...stagingEnvironment.config,
					clientAuthMethod: "private_key_jwt" as const,
					jwksUri: "https://staging.example.com/jwks",
				},
			},
			error: null,
			isLoading: false,
		});

		render(<ProductionEnvironmentRequestPage />);
		await goToStepThree();

		expect(screen.queryByRole("radio")).toBeNull();
		expect(
			screen.getByDisplayValue("https://staging.example.com/jwks")
		).toBeTruthy();
		fireEvent.input(screen.getByLabelText("JWKS URI"), {
			target: { value: "https://production.example.com/jwks" },
		});
		expect(
			screen.getByDisplayValue("https://production.example.com/jwks")
		).toBeTruthy();
	});

	it("renders a summary-only manage-style security review", async () => {
		render(<ProductionEnvironmentRequestPage />);
		await goToStepFour();

		expect(screen.getByRole("heading", { name: "Check your answers" })).toBeTruthy();
		expect(
			screen.getByText(
				"Check the details before you request production. Some settings are based on your staging environment and cannot be changed."
			)
		).toBeTruthy();
		expect(screen.getByText("PRODUCTION")).toBeTruthy();
		expect(screen.getByText("Production status")).toBeTruthy();
		expect(screen.getByText("Requested")).toBeTruthy();
		for (const heading of [
			"Environment",
			"Connection",
			"Authentication",
			"Verification and signing",
			"Encryption and decryption",
		]) {
			expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
		}
		expect(screen.getByText("https://staging.example.com/callback")).toBeTruthy();
		expect(screen.getByText("https://staging.example.com/logout")).toBeTruthy();
		expect(screen.getByText("192.0.2.10")).toBeTruthy();
		expect(screen.getByText("ID token")).toBeTruthy();
		expect(screen.getByText("RS256")).toBeTruthy();
		expect(screen.queryByRole("textbox")).toBeNull();
		expect(screen.queryByRole("radio")).toBeNull();
		expect(screen.queryByRole("checkbox")).toBeNull();

		for (const field of [
			"Environment name",
			"English environment URL",
			"French environment URL",
			"Redirect URIs",
			"Post-logout redirect URIs",
			"Outbound IP addresses",
			"Sign-out request URL",
		]) {
			expect(
				screen.getByRole("link", { name: `Change ${field}` })
			).toBeTruthy();
		}
		for (const field of [
			"Single sign-out method",
			"Client type",
			"Proof Key for Code Exchange (PKCE)",
			"Client authentication method",
			"Messages verified",
			"Verification algorithms",
			"Messages signed",
			"Requests encrypted",
			"Messages decrypted",
		]) {
			expect(
				screen.queryByRole("link", { name: `Change ${field}` })
			).toBeNull();
		}
	});

	it("returns a Change link to the matching earlier input", async () => {
		render(<ProductionEnvironmentRequestPage />);
		await goToStepFour();

		expect(
			screen
				.getByRole("link", { name: "Change Redirect URIs" })
			.getAttribute("href")
		).toBe("#redirect-uri-0");
		fireEvent.click(
			screen.getByRole("link", { name: "Change Redirect URIs" })
		);
		await waitFor(() => {
			expect(screen.getByText("Redirect URLs")).toBeTruthy();
		});
		expect(document.activeElement).toBe(screen.getByLabelText("Redirect URL 1"));
	});

	it("returns to editable JWKS from the summary for private key JWT", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: {
				...stagingEnvironment,
				config: {
					...stagingEnvironment.config,
					clientAuthMethod: "private_key_jwt" as const,
					jwksUri: "https://staging.example.com/jwks",
				},
			},
			error: null,
			isLoading: false,
		});

		render(<ProductionEnvironmentRequestPage />);
		await goToStepFour();

		fireEvent.click(
			screen.getByRole("link", {
			name: "Change JSON Web Key Set (JWKS) URI",
		})
		);
		await waitFor(() => {
			expect(screen.getByText("Authentication")).toBeTruthy();
		});
		expect(screen.getByDisplayValue("https://staging.example.com/jwks")).toBeTruthy();
		expect(document.activeElement).toBe(screen.getByLabelText("JWKS URI"));
	});

	it("submits the copied configuration without outbound IPs", async () => {
		render(<ProductionEnvironmentRequestPage />);
		await goToStepFour();
		fireEvent.click(
			 screen.getByRole("button", { name: "Request production" })
		);

		await waitFor(() => {
			expect(mockedCreateEnvironment).toHaveBeenCalledOnce();
		});
		const payload = mockedCreateEnvironment.mock.calls[0]?.[0] as Record<
			string,
			unknown
		>;
		expect(payload).toMatchObject({
			applicationUrlEn: "https://staging.example.com/en",
			applicationUrlFr: "https://staging.example.com/fr",
			copyExisting: true,
			environmentName: "PRODUCTION-portal-prod",
			sourceEnvironmentUuid: "environment-uuid-1",
			tenantCode: "production",
		});
		expect(payload).not.toHaveProperty("outboundIps");
		expect(mockedNavigate).toHaveBeenCalledWith({
			to: "/applications/$applicationUuid/environments/$environmentUuid",
			params: {
				applicationUuid: "application-uuid-1",
				environmentUuid: "production-uuid-1",
			},
		});
	});

	it("prevents production requests from non-STAGING environments", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: { ...stagingEnvironment, tenantCode: "test" },
			error: null,
			isLoading: false,
		});

		render(<ProductionEnvironmentRequestPage />);

		expect(
			await screen.findByText(
				"You can request a production environment only from a STAGING environment."
			)
		).toBeTruthy();
		expect(screen.queryByRole("textbox")).toBeNull();
	});
});
