import type { PropsWithChildren, ReactElement, ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EnvironmentManagementPage } from "@/features/application-environments/pages/EnvironmentManagementPage";

const {
	mockedLanguage,
	mockedNavigate,
	mockedUseApplicationEnvironment,
	mockedUseNavigate,
} =
	vi.hoisted(() => {
		const mockedNavigate = vi.fn();
		return {
			mockedLanguage: { value: "en" },
			mockedNavigate,
			mockedUseApplicationEnvironment: vi.fn(),
			mockedUseNavigate: vi.fn(() => mockedNavigate),
		};
	});

vi.mock("@tanstack/react-router", () => ({
	useNavigate: mockedUseNavigate,
	useParams: () => ({
		applicationUuid: "application-uuid-1",
		environmentUuid: "environment-uuid-1",
	}),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: {
			language: mockedLanguage.value,
			resolvedLanguage: mockedLanguage.value,
		},
		t: (key: string, options?: { field?: string }): string => {
			if (key === "applicationEnvironmentManagement.changeAccessible") {
				return `Change ${options?.field ?? "field"}`;
			}
			if (key === "applicationEnvironmentManagement.fields.englishUrl") {
				return "English environment URL";
			}
			if (key === "applicationEnvironmentManagement.fields.frenchUrl") {
				return "French environment URL";
			}
			if (
				key === "applicationEnvironmentManagement.fields.authenticationMethod"
			) {
				return "Client authentication method";
			}
			if (key === "applicationEnvironmentManagement.fields.messagesVerified") {
				return "Messages verified";
			}
			if (key === "applicationEnvironmentManagement.fields.messagesSigned") {
				return "Messages signed";
			}
			if (
				key === "applicationEnvironmentManagement.fields.requestsEncrypted"
			) {
				return "Requests encrypted";
			}
			if (
				key === "applicationEnvironmentManagement.fields.messagesDecrypted"
			) {
				return "Messages decrypted";
			}
			if (
				key === "applicationEnvironmentManagement.fields.decryptionKeyManagement"
			) {
				return "Decryption key management";
			}
			if (
				key === "applicationEnvironmentManagement.fields.decryptionAlgorithms"
			) {
				return "Decryption algorithms";
			}
			if (key === "applicationEnvironmentManagement.fields.outboundIps") {
				return "Outbound IP addresses";
			}
			if (
				key === "applicationEnvironmentManagement.fields.signOutRequestUrl"
			) {
				return "Sign-out request URL";
			}
			if (key.startsWith("applicationEnvironmentManagement.values.https://")) {
				return key.replace("https:", "");
			}
			if (
				key === "applicationEnvironmentManagement.fields.encryptionKeyManagement"
			) {
				return "Encryption key management";
			}
			if (key === "applicationEnvironmentManagement.fields.encryptionAlgorithms") {
				return "Encryption algorithms";
			}
			if (key === "applicationEnvironmentManagement.fields.jwksUri") {
				return "JSON Web Key Set (JWKS) URI";
			}
			if (
				key === "applicationEnvironmentManagement.fields.verificationAlgorithms"
			) {
				return "Verification algorithms";
			}
			if (
				key === "applicationEnvironmentManagement.fields.signingAlgorithms"
			) {
				return "Signing algorithms";
			}
			const translations: Record<string, string> = {
				"applicationEnvironmentManagement.change": "Change",
				"applicationEnvironmentManagement.fields.environmentName":
					"Environment name",
				"applicationEnvironmentManagement.fields.clientType": "Client type",
				"applicationEnvironmentManagement.fields.pkce":
					"Proof Key for Code Exchange (PKCE)",
				"applicationEnvironmentManagement.fields.redirectUris": "Redirect URLs",
				"applicationEnvironmentManagement.fields.postLogoutRedirectUris":
					"Post logout redirect URLs",
				"applicationEnvironmentManagement.fields.created": "Created",
				"applicationEnvironmentManagement.fields.lastModified": "Last modified",
				"applicationEnvironmentManagement.configurationTab": "Configuration",
				"applicationEnvironmentManagement.credentialsTab": "Credentials",
				"applicationEnvironmentManagement.inactive": "Inactive",
				"applicationEnvironmentManagement.enabled": "Enabled",
				"applicationEnvironmentManagement.requestProduction":
					"Request production",
				"applicationEnvironmentManagement.sections.authentication":
					"Authentication",
				"applicationEnvironmentManagement.sections.connection": "Connection",
				"applicationEnvironmentManagement.sections.environment": "Environment",
				"applicationEnvironmentManagement.sections.encryptionDecryption":
					"Encryption and decryption",
				"applicationEnvironmentManagement.sections.verificationSigning":
					"Verification and signing",
				"applicationEnvironments.switchApplication": "Switch application",
				"applicationEnvironmentManagement.summary":
					"Review the configuration for this environment.",
				"applicationEnvironmentManagement.tabsLabel": "Environment views",
				"applicationEnvironmentManagement.title": "Environment configuration",
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

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		onGcdsClick,
	}: PropsWithChildren<{ onGcdsClick?: () => void }>): ReactElement => (
		<button onClick={() => onGcdsClick?.()}>{children}</button>
	),
	Grid: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag: "h1" | "h2" }>): ReactElement => {
		const HeadingTag = tag;
		return <HeadingTag>{children}</HeadingTag>;
	},
	Icon: ({ name }: { name: string }): ReactElement => <span>{name}</span>,
	Link: ({
		ariaLabel,
		children,
		href,
	}: PropsWithChildren<{ ariaLabel?: string; href: string }>): ReactElement => (
		<a aria-label={ariaLabel} href={href}>
			{children}
		</a>
	),
	Tabs: ({
		ariaLabel,
		items,
	}: {
		ariaLabel: string;
		items: Array<{ active?: boolean; href: string; label: ReactNode }>;
	}): ReactElement => (
		<nav aria-label={ariaLabel}>
			{items.map((item) => (
				<a
					aria-current={item.active ? "page" : undefined}
					href={item.href}
					key={item.href}
				>
					{item.label}
				</a>
			))}
		</nav>
	),
	Notice: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
	),
	ConfigurationGrid: ({
		ariaLabel,
		rows,
	}: {
		ariaLabel: string;
		rows: Array<{ edit?: ReactNode; field: ReactNode; value: ReactNode }>;
	}): ReactElement => (
		<section aria-label={ariaLabel}>
			{rows.map((row, rowIndex) => (
				<div key={rowIndex}>
					<div>{row.field}</div>
					<div>{row.value}</div>
					<div>{row.edit}</div>
				</div>
			))}
		</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

describe("EnvironmentManagementPage", () => {
	const environment = {
		config: {
			applicationUrlEn: "https://example.com/en",
			applicationUrlFr: "https://example.com/fr",
			canDecryptMessages: false,
			canEncryptRequests: false,
			canSignMessages: false,
			clientAuthMethod: "private_key_jwt" as const,
			clientType: "public" as const,
			copyExisting: false,
			decryptionContentAlgorithms: [],
			decryptionKeyAlgorithms: [],
			decryptionMessages: [],
			encryptionContentAlgorithms: [],
			encryptionKeyAlgorithms: [],
			environmentName: "portal",
			jwksUri: "https://example.com/jwks",
			pkceSupported: true,
			postLogoutRedirectUris: [],
			redirectUris: [],
			signingMessages: [],
			signingSignatureAlgorithms: [],
			singleSignOut: false,
			tenantCode: "test" as const,
			verificationMessages: ["id_token" as const],
			verificationSignatureAlgorithms: ["RS256" as const],
		},
		createdAt: "2026-09-17T00:00:00Z",
		partnerLabel: "Test environment",
		statusCode: "draft",
		tenantCode: "test",
		updatedAt: null,
		uuid: "environment-uuid-1",
	};

	it("uses the French hour marker for French timestamps", () => {
		mockedLanguage.value = "fr";
		try {
			mockedUseApplicationEnvironment.mockReturnValue({
				data: environment,
				error: null,
				isLoading: false,
			});

			render(<EnvironmentManagementPage />);

			expect(screen.getAllByText(/\d{1,2} h \d{2}/)).toHaveLength(2);
		} finally {
			mockedLanguage.value = "en";
		}
	});

	it("renders inactive values and accessible change links without a production action for TEST", () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: environment,
			error: null,
			isLoading: false,
		});

		render(<EnvironmentManagementPage />);

		expect(screen.getAllByText("Inactive").length).toBeGreaterThan(0);
		expect(
			screen
				.getByRole("link", { name: "Switch application" })
				.getAttribute("href")
		).toBe("/applications");
		expect(screen.getByText("https://example.com/en")).toBeTruthy();
		expect(screen.getByText("https://example.com/fr")).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "Change English environment URL" })
		).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: "Change French environment URL" })
				.getAttribute("href")
		).toBe(
			"/applications/application-uuid-1/environments/environment-uuid-1/french-url"
		);
		expect(
			screen
				.getByRole("link", { name: "Change Environment name" })
				.getAttribute("href")
		).toBe(
			"/applications/application-uuid-1/environments/environment-uuid-1/environment-name"
		);
		expect(
			screen
				.getByRole("link", { name: "Change Client type" })
				.getAttribute("href")
		).toBe(
			"/applications/application-uuid-1/environments/environment-uuid-1/client-type"
		);
		expect(
			screen
				.getByRole("link", {
					name: "Change Proof Key for Code Exchange (PKCE)",
				})
				.getAttribute("href")
		).toBe(
			"/applications/application-uuid-1/environments/environment-uuid-1/client-type"
		);
		expect(
			screen
				.getByRole("link", { name: "Change Client authentication method" })
				.getAttribute("href")
		).toBe(
			"/applications/application-uuid-1/environments/environment-uuid-1/authentication-method"
		);
		expect(
			screen
				.getByRole("link", {
					name: "Change JSON Web Key Set (JWKS) URI",
				})
				.getAttribute("href")
		).toBe(
			"/applications/application-uuid-1/environments/environment-uuid-1/authentication-method"
		);
		expect(
			screen
				.getByRole("link", { name: "Change Redirect URLs" })
				.getAttribute("href")
		).toBe(
			"/applications/application-uuid-1/environments/environment-uuid-1/redirect-urls"
		);
		expect(
			screen
				.getByRole("link", { name: "Change Post logout redirect URLs" })
				.getAttribute("href")
		).toBe(
			"/applications/application-uuid-1/environments/environment-uuid-1/post-logout-redirect-urls"
		);
		expect(
			screen
				.getByRole("link", { name: "Change Messages verified" })
				.getAttribute("href")
		).toBe(
			"/applications/application-uuid-1/environments/environment-uuid-1/messages-verified"
		);
		expect(
			screen
				.getByRole("link", { name: "Change Verification algorithms" })
				.getAttribute("href")
		).toBe(
			"/applications/application-uuid-1/environments/environment-uuid-1/messages-verified"
		);
		expect(
			screen
				.getByRole("link", { name: "Change Messages signed" })
				.getAttribute("href")
		).toBe(
				"/applications/application-uuid-1/environments/environment-uuid-1/messages-signed"
		);
		expect(screen.getAllByText("Change").length).toBeGreaterThan(0);
		expect(
			screen.getAllByRole("link", { name: /^Change / }).length
		).toBeGreaterThan(0);
		expect(
			screen.queryByRole("button", { name: "Request production" })
		).toBeNull();
		expect(screen.queryByText("Outbound IP addresses")).toBeNull();
		expect(
			screen.getByRole("link", { name: "Credentials" }).getAttribute("href")
		).toBe(
			"/applications/application-uuid-1/environments/environment-uuid-1/credentials"
		);
		expect(
			screen
				.getByRole("link", { name: "Configuration" })
				.getAttribute("aria-current")
		).toBe("page");
	});

	it("shows the production request action only for STAGING", () => {
		mockedNavigate.mockClear();
		mockedUseApplicationEnvironment.mockReturnValue({
			data: { ...environment, tenantCode: "staging" },
			error: null,
			isLoading: false,
		});

		render(<EnvironmentManagementPage />);

		const requestButton = screen.getByRole("button", {
			name: "Request production",
		});
		expect(requestButton).toBeTruthy();
		expect(screen.queryByText("Outbound IP addresses")).toBeNull();

		fireEvent.click(requestButton);

		expect(mockedNavigate).not.toHaveBeenCalled();
	});

	it("shows outbound IP addresses only for PRODUCTION", () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: { ...environment, tenantCode: "production" },
			error: null,
			isLoading: false,
		});

		render(<EnvironmentManagementPage />);

		expect(screen.getByText("Outbound IP addresses")).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: "Change Outbound IP addresses" })
				.getAttribute("href")
		).toBe("#");
	});

	it("renders URL lists on separate lines", () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: {
				...environment,
				config: {
					...environment.config,
					postLogoutRedirectUris: [
						"https://example.com/logout-one",
						"https://example.com/logout-two",
					],
					redirectUris: [
						"https://example.com/redirect-one",
						"https://example.com/redirect-two",
					],
				},
			},
			error: null,
			isLoading: false,
		});

		render(<EnvironmentManagementPage />);

		for (const label of ["Redirect URLs", "Post logout redirect URLs"]) {
			const row = screen.getByText(label).parentElement?.parentElement;
			expect(row?.children[1]?.querySelectorAll("br") ?? []).toHaveLength(1);
		}
	});

	it("links the sign-out request URL to the single sign-out editor", () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: {
				...environment,
				config: {
					...environment.config,
					signOutRequestUrl: "https://example.com/sign-out",
					singleSignOut: true,
				},
			},
			error: null,
			isLoading: false,
		});

		render(<EnvironmentManagementPage />);

		expect(
			screen
				.getByRole("link", { name: "Change Sign-out request URL" })
				.getAttribute("href")
		).toBe(
			"/applications/application-uuid-1/environments/environment-uuid-1/single-sign-out-method"
		);
	});

	it("links signing algorithms to the signing editor when signing is enabled", () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: {
				...environment,
				config: {
					...environment.config,
					canSignMessages: true,
					signingMessages: ["request_object" as const],
					signingSignatureAlgorithms: ["RS256" as const],
				},
			},
			error: null,
			isLoading: false,
		});

		render(<EnvironmentManagementPage />);

		expect(
			screen
				.getByRole("link", { name: "Change Signing algorithms" })
				.getAttribute("href")
		).toBe(
				"/applications/application-uuid-1/environments/environment-uuid-1/messages-signed"
		);
	});

	it("links request-encryption settings to the encryption editor", () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: {
				...environment,
				config: {
					...environment.config,
					canEncryptRequests: true,
					encryptionKeyAlgorithms: ["RSA-OAEP" as const],
					encryptionContentAlgorithms: ["A256GCM" as const],
				},
			},
			error: null,
			isLoading: false,
		});

		render(<EnvironmentManagementPage />);

		const encryptionHref =
			"/applications/application-uuid-1/environments/environment-uuid-1/requests-encrypted";
		expect(
			screen
				.getByRole("link", { name: "Change Requests encrypted" })
				.getAttribute("href")
		).toBe(encryptionHref);
		expect(
			screen
				.getByRole("link", { name: "Change Encryption key management" })
				.getAttribute("href")
		).toBe(encryptionHref);
		expect(
			screen
				.getByRole("link", { name: "Change Encryption algorithms" })
				.getAttribute("href")
		).toBe(encryptionHref);
		expect(screen.getAllByText("Enabled")).toHaveLength(2);
	});

	it("links message-decryption settings to the decryption editor", () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: {
				...environment,
				config: {
					...environment.config,
					canDecryptMessages: true,
					decryptionMessages: ["id_token" as const],
					decryptionKeyAlgorithms: ["RSA-OAEP" as const],
					decryptionContentAlgorithms: ["A256GCM" as const],
				},
			},
			error: null,
			isLoading: false,
		});

		render(<EnvironmentManagementPage />);

		const decryptionHref =
			"/applications/application-uuid-1/environments/environment-uuid-1/messages-decrypted";
		expect(
			screen
				.getByRole("link", { name: "Change Messages decrypted" })
				.getAttribute("href")
		).toBe(decryptionHref);
		expect(
			screen
				.getByRole("link", { name: "Change Decryption key management" })
				.getAttribute("href")
		).toBe(decryptionHref);
		expect(
			screen
				.getByRole("link", { name: "Change Decryption algorithms" })
				.getAttribute("href")
		).toBe(decryptionHref);
	});
});
