import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvironmentAuthenticationMethodPage } from "@/features/application-environments/pages/EnvironmentAuthenticationMethodPage";

const {
	mockedNavigate,
	mockedUpdateEnvironmentAuthenticationMethod,
	mockedUseApplicationEnvironment,
	mockedUseApplicationEnvironments,
} = vi.hoisted(() => ({
	mockedNavigate: vi.fn(),
	mockedUpdateEnvironmentAuthenticationMethod: vi.fn(),
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

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { resolvedLanguage: "en" },
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"applicationEnvironmentConnect.applicationNameFallback":
					"this application",
				"applicationEnvironmentConnect.clientSecretBasic":
					"Client secret basic",
				"applicationEnvironmentConnect.clientSecretPost":
					"Client secret post",
				"applicationEnvironmentConnect.privateKeyJwt": "Private key JWT",
				"applicationEnvironmentConnect.stepThree.clientAuthMethod":
					"How does your environment authenticate when requesting tokens?",
				"applicationEnvironmentConnect.stepThree.clientSecretBasicHint":
					"Sends the client ID and secret in the authorization header.",
				"applicationEnvironmentConnect.stepThree.clientSecretPostHint":
					"Sends the client ID and secret in the request body.",
				"applicationEnvironmentConnect.stepThree.jwksUri":
					"JSON Web Key Set (JWKS) URI",
				"applicationEnvironmentConnect.stepThree.jwksUriHint":
					"CanadaLogin uses the JSON Web Key Set (JWKS) URI to access your public keys and verify signed messages.",
				"applicationEnvironmentConnect.stepThree.privateKeyJwtHint":
					"Uses a JSON Web Token (JWT) signed with your private key.",
				"applicationEnvironmentConnect.stepThree.validationClientAuthMethod":
					"Select a client authentication method.",
				"applicationEnvironmentConnect.stepThree.validationJwksUri":
					"Enter a valid JWKS URI.",
				"applicationEnvironmentManagement.authenticationMethodEditorIntro":
					"Choose how your application authenticates when connecting to CanadaLogin.",
				"applicationEnvironmentManagement.authenticationMethodEditorLearnMore":
					"Learn more about client authentication methods.",
				"applicationEnvironmentManagement.cancel": "Cancel",
				"applicationEnvironmentManagement.changeAuthenticationMethod":
					"Change authentication method",
				"applicationEnvironmentManagement.errorBody":
					"The environment could not be loaded.",
				"applicationEnvironmentManagement.errorTitle":
					"Unable to load environment",
				"applicationEnvironmentManagement.loadingBody":
					"Loading the environment configuration.",
				"applicationEnvironmentManagement.loadingTitle": "Loading environment",
				"applicationEnvironmentManagement.saveChanges": "Save changes",
				"applicationEnvironments.switchApplication": "Switch application",
			};
			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@/fetch", () => ({
	getRequestErrorNotice: () => null,
}));

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
			authenticationMethodUpdateError: null,
			isUpdatingAuthenticationMethod: false,
			updateEnvironmentAuthenticationMethod:
				mockedUpdateEnvironmentAuthenticationMethod,
		}),
	})
);

vi.mock("@/components/ui", () => {
	const passthrough = ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	);

	return {
		Button: ({
			children,
			disabled,
			type,
		}: PropsWithChildren<{
			disabled?: boolean;
			type?: "button" | "submit";
		}>): ReactElement => (
			<button disabled={disabled} type={type}>
				{children}
			</button>
		),
		ErrorSummary: ({
			errorLinks,
		}: {
			errorLinks?: Record<string, string>;
		}): ReactElement => (
			<div data-testid="error-summary">
				{Object.entries(errorLinks ?? {}).map(([href, label]) => (
					<a href={href} key={href}>
						{label}
					</a>
				))}
			</div>
		),
		Grid: passthrough,
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
				<input
					id={inputId}
					name={name}
					value={value ?? ""}
					onInput={onInput}
				/>
			</label>
		),
		Link: ({
			children,
			href,
		}: PropsWithChildren<{ href: string }>): ReactElement => (
			<a href={href}>{children}</a>
		),
		Notice: passthrough,
		Radios: ({
			 errorMessage,
			 id,
			 legend,
			 name,
			 onInput,
			 options,
			 value,
		}: {
			id: string;
			legend: string;
			name: string;
			onInput: React.FormEventHandler<Element>;
			options: Array<{ id: string; label: string; value: string }>;
			errorMessage?: string;
			value?: string;
		}): ReactElement => (
			<fieldset id={id}>
				<legend>{legend}</legend>
				{options.map((option) => (
					<label key={option.id} htmlFor={option.id}>
						{option.label}
						<input
							checked={value === option.value}
							id={option.id}
							name={name}
							onInput={onInput}
							readOnly
							type="radio"
							value={option.value}
						/>
					</label>
				))}
				{errorMessage ? <span role="alert">{errorMessage}</span> : null}
			</fieldset>
		),
		Text: passthrough,
	};
});

describe("EnvironmentAuthenticationMethodPage", () => {
	const environment = {
		config: {
			clientAuthMethod: "private_key_jwt" as const,
			clientType: "confidential" as const,
			jwksUri: "https://example.com/jwks",
		},
		createdAt: "2026-09-17T00:00:00Z",
		partnerLabel: "TEST-portal",
		statusCode: "submitted",
		tenantCode: "test",
		updatedAt: null,
		uuid: "environment-uuid-1",
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockedUseApplicationEnvironment.mockReturnValue({
			data: environment,
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
		mockedUpdateEnvironmentAuthenticationMethod.mockResolvedValue(environment);
	});

	it("hydrates the method and JWKS controls and clears JWKS for client secrets", async () => {
		render(<EnvironmentAuthenticationMethodPage />);

		expect(
			screen.getByRole("heading", { name: "Change authentication method" })
		).toBeTruthy();
		expect(
			screen.getByText(
				"Choose how your application authenticates when connecting to CanadaLogin."
			)
		).toBeTruthy();
		expect(
			screen.getByText("Learn more about client authentication methods.")
		).toBeTruthy();
		expect(
			screen.getByRole("group", {
			name: "How does your environment authenticate when requesting tokens?",
		})
		).toBeTruthy();
		expect(
			(screen.getByRole("radio", { name: "Private key JWT" }) as HTMLInputElement)
				.checked
		).toBe(true);
		expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
			"https://example.com/jwks"
		);
		expect(
			screen.getByRole("button", { name: "Save changes" }).closest("form")
			?.hasAttribute("novalidate")
		).toBe(true);

		fireEvent.input(screen.getByRole("radio", { name: "Client secret basic" }));

		expect(screen.queryByRole("textbox")).toBeNull();
		fireEvent.submit(
			screen.getByRole("button", { name: "Save changes" }).closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(mockedUpdateEnvironmentAuthenticationMethod).toHaveBeenCalledWith({
				clientAuthMethod: "client_secret_basic",
				environmentUuid: "environment-uuid-1",
				jwksUri: null,
			});
		});
		expect(mockedNavigate).toHaveBeenCalledWith({
			params: {
				applicationUuid: "application-uuid-1",
				environmentUuid: "environment-uuid-1",
			},
			to: "/applications/$applicationUuid/environments/$environmentUuid",
		});
	});

	it("allows a public environment to submit a client-secret method", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: {
				...environment,
				config: {
					clientAuthMethod: "client_secret_post",
					clientType: "public",
				},
			},
			error: null,
			isLoading: false,
		});

		render(<EnvironmentAuthenticationMethodPage />);
		fireEvent.submit(
			screen.getByRole("button", { name: "Save changes" }).closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(mockedUpdateEnvironmentAuthenticationMethod).toHaveBeenCalledWith({
				clientAuthMethod: "client_secret_post",
				environmentUuid: "environment-uuid-1",
				jwksUri: null,
			});
		});
	});

	it("shows matching errors when the authentication method is missing", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: { ...environment, config: {} },
			error: null,
			isLoading: false,
		});

		render(<EnvironmentAuthenticationMethodPage />);
		fireEvent.submit(
			screen.getByRole("button", { name: "Save changes" }).closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(screen.getByTestId("error-summary")).toBeTruthy();
		});
		expect(
			screen
				.getByRole("link", { name: "Select a client authentication method." })
				.getAttribute("href")
		).toBe("#client-auth-method-control");
		expect(
			screen.getByText("Select a client authentication method.", {
			selector: '[role="alert"]',
		})
		).toBeTruthy();
		expect(mockedUpdateEnvironmentAuthenticationMethod).not.toHaveBeenCalled();
	});

	it("shows a matching error when a private-key JWKS URI is missing", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: {
				...environment,
				config: { clientAuthMethod: "private_key_jwt", jwksUri: "" },
			},
			error: null,
			isLoading: false,
		});

		render(<EnvironmentAuthenticationMethodPage />);
		fireEvent.submit(
			screen.getByRole("button", { name: "Save changes" }).closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(
				screen
					.getByRole("link", { name: "Enter a valid JWKS URI." })
					.getAttribute("href")
			).toBe("#jwks-uri-control");
		});
		expect(
			screen
				.getByLabelText("JSON Web Key Set (JWKS) URI")
				.parentElement?.getAttribute("data-error")
		).toBe("Enter a valid JWKS URI.");
		expect(mockedUpdateEnvironmentAuthenticationMethod).not.toHaveBeenCalled();
	});

	it("keeps Cancel pointed at environment management", () => {
		render(<EnvironmentAuthenticationMethodPage />);

		expect(screen.getByRole("link", { name: "Cancel" }).getAttribute("href")).toBe(
			"/applications/application-uuid-1/environments/environment-uuid-1"
		);
	});
});
