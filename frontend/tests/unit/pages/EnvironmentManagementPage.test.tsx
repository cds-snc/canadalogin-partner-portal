import type { PropsWithChildren, ReactElement, ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EnvironmentManagementPage } from "@/features/application-environments/pages/EnvironmentManagementPage";

const {
	mockedLanguage,
	mockedNavigate,
	mockedUseApplicationEnvironment,
	mockedUseNavigate,
} = vi.hoisted(() => {
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
	useRouteContext: () => ({ rpApplicationName: "Benefits portal" }),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { resolvedLanguage: mockedLanguage.value },
		t: (key: string, options?: { field?: string }): string => {
			if (key === "applicationEnvironmentManagement.changeAccessible") {
				return `Change ${options?.field ?? "field"}`;
			}
			if (key === "applicationEnvironmentManagement.fields.englishUrl") {
				return "English application URL";
			}
			const translations: Record<string, string> = {
				"applicationEnvironmentManagement.change": "Change",
				"applicationEnvironmentManagement.configurationTab": "Configuration",
				"applicationEnvironmentManagement.credentialsTab": "Credentials",
				"applicationEnvironmentManagement.inactive": "Inactive",
				"applicationEnvironmentManagement.fields.created": "Created",
				"applicationEnvironmentManagement.fields.lastModified": "Last modified",
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
	Link: ({
		ariaLabel,
		children,
		href,
	}: PropsWithChildren<{ ariaLabel?: string; href: string }>): ReactElement => (
		<a aria-label={ariaLabel} href={href}>
			{children}
		</a>
	),
	Icon: ({ name }: { name: string }): ReactElement => <span>{name}</span>,
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
			clientType: "public" as const,
			copyExisting: false,
			decryptionContentAlgorithms: [],
			decryptionKeyAlgorithms: [],
			decryptionMessages: [],
			encryptionContentAlgorithms: [],
			encryptionKeyAlgorithms: [],
			environmentName: "portal",
			pkceSupported: true,
			postLogoutRedirectUris: [],
			redirectUris: [],
			sharesIdentifier: false,
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
		expect(screen.getByText("Benefits portal")).toBeTruthy();
		const expectedCreatedDate = new Intl.DateTimeFormat("en", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			timeZoneName: "short",
		}).format(new Date(environment.createdAt));
		expect(screen.getAllByText(expectedCreatedDate)).toHaveLength(2);
		expect(screen.getByText("arrow-up-down")).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "Switch application" }).getAttribute("href")
		).toBe("/applications");
		expect(
			screen.getByRole("link", { name: "Change English application URL" })
		).toBeTruthy();
		expect(screen.getAllByText("Change").length).toBeGreaterThan(0);
		expect(
			screen.getAllByRole("link", { name: /^Change / }).length
		).toBeGreaterThan(0);
		expect(
			screen.queryByRole("button", { name: "Request production" })
		).toBeNull();
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

		fireEvent.click(requestButton);

		expect(mockedNavigate).not.toHaveBeenCalled();
	});
});
