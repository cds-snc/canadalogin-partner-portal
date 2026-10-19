import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvironmentClientTypePage } from "@/features/application-environments/pages/EnvironmentClientTypePage";

const {
	mockedNavigate,
	mockedUpdateEnvironmentClientType,
	mockedUseApplicationEnvironment,
	mockedUseApplicationEnvironments,
} = vi.hoisted(() => ({
	mockedNavigate: vi.fn(),
	mockedUpdateEnvironmentClientType: vi.fn(),
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
				"applicationEnvironmentConnect.confidentialClient": "Confidential",
				"applicationEnvironmentConnect.publicClient": "Public",
				"applicationEnvironmentConnect.stepThree.clientType": "Client type",
				"applicationEnvironmentConnect.stepThree.confidentialClientHint":
					"Can securely store client credentials.",
				"applicationEnvironmentConnect.stepThree.pkceHint":
					"Required for public clients.",
				"applicationEnvironmentConnect.stepThree.pkceSupported":
					"Does your environment support PKCE using at least the S256 hashing algorithm?",
				"applicationEnvironmentConnect.stepThree.publicClientHint":
					"Cannot securely store client credentials.",
				"applicationEnvironmentConnect.stepThree.validationClientType":
					"Select a client type.",
				"applicationEnvironmentConnect.stepThree.validationPkceSupported":
					"Select Yes to confirm that your environment supports PKCE using at least the S256 hashing algorithm.",
				"applicationEnvironmentManagement.cancel": "Cancel",
				"applicationEnvironmentManagement.changeClientType":
					"Change client type",
				"applicationEnvironmentManagement.clientTypeEditorIntro":
					"Public clients must support Proof Key for Code Exchange (PKCE) using at least the S256 hashing algorithm.",
				"applicationEnvironmentManagement.clientTypeEditorLearnMore":
					"Learn more about the client types and PKCE.",
				"applicationEnvironmentManagement.errorBody":
					"The environment could not be loaded.",
				"applicationEnvironmentManagement.errorTitle":
					"Unable to load environment",
				"applicationEnvironmentManagement.loadingBody":
					"Loading the environment configuration.",
				"applicationEnvironmentManagement.loadingTitle": "Loading environment",
				"applicationEnvironmentManagement.saveChanges": "Save changes",
				"applicationEnvironments.switchApplication": "Switch application",
				"common.no": "No",
				"common.yes": "Yes",
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
			clientTypeUpdateError: null,
			isUpdatingClientType: false,
			updateEnvironmentClientType: mockedUpdateEnvironmentClientType,
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
					<label key={option.id}>
						{option.label}
						<input
							checked={value === option.value}
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

describe("EnvironmentClientTypePage", () => {
	const environment = {
		config: { clientType: "confidential" as const, pkceSupported: false },
		createdAt: "2026-09-17T00:00:00Z",
		partnerLabel: "Test environment",
		statusCode: "draft",
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
		mockedUpdateEnvironmentClientType.mockResolvedValue(environment);
	});

	it("hydrates both controls and forces PKCE on for Public", async () => {
		render(<EnvironmentClientTypePage />);

		expect(screen.getByRole("heading", { name: "Change client type" })).toBeTruthy();
		expect(
			screen.getByText(
				"Public clients must support Proof Key for Code Exchange (PKCE) using at least the S256 hashing algorithm."
			)
		).toBeTruthy();
		expect(screen.getByText("Learn more about the client types and PKCE.")).toBeTruthy();
		expect(
			screen.getByRole("group", { name: "Client type" }).getAttribute("id")
		).toBe("client-type-control");
		expect(
			screen
				.getByRole("group", {
					name: "Does your environment support PKCE using at least the S256 hashing algorithm?",
				})
				.getAttribute("id")
		).toBe("pkce-supported-control");
		expect((screen.getByLabelText("No") as HTMLInputElement).checked).toBe(true);

		fireEvent.click(screen.getByLabelText("Public"));

		expect((screen.getByLabelText("Yes") as HTMLInputElement).checked).toBe(true);
	});

	it("submits the atomic client type and PKCE payload and navigates back", async () => {
		render(<EnvironmentClientTypePage />);

		fireEvent.click(screen.getByLabelText("Public"));
		fireEvent.submit(screen.getByRole("button", { name: "Save changes" }).closest("form") as HTMLFormElement);

		await waitFor(() => {
			expect(mockedUpdateEnvironmentClientType).toHaveBeenCalledWith({
				clientType: "public",
				environmentUuid: "environment-uuid-1",
				pkceSupported: true,
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

	it("shows inline errors and matching links when both settings are missing", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: { ...environment, config: {} },
			error: null,
			isLoading: false,
		});

		render(<EnvironmentClientTypePage />);
		fireEvent.submit(screen.getByRole("button", { name: "Save changes" }).closest("form") as HTMLFormElement);

		await waitFor(() => {
			expect(screen.getByTestId("error-summary")).toBeTruthy();
		});
		expect(
			screen
				.getByRole("link", { name: "Select a client type." })
				.getAttribute("href")
		).toBe("#client-type-control");
		expect(
			screen
				.getByRole("link", {
					name: "Select Yes to confirm that your environment supports PKCE using at least the S256 hashing algorithm.",
				})
				.getAttribute("href")
		).toBe("#pkce-supported-control");
		expect(
			screen.getByText("Select a client type.", {
			selector: '[role="alert"]',
		})
		).toBeTruthy();
		expect(
			screen.getByText(
				"Select Yes to confirm that your environment supports PKCE using at least the S256 hashing algorithm.",
				{ selector: '[role="alert"]' }
			)
		).toBeTruthy();
		expect(mockedUpdateEnvironmentClientType).not.toHaveBeenCalled();
	});

	it("shows only the client type error when PKCE is already set", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: { ...environment, config: { pkceSupported: false } },
			error: null,
			isLoading: false,
		});

		render(<EnvironmentClientTypePage />);
		fireEvent.submit(
			screen.getByRole("button", { name: "Save changes" }).closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(
				screen.getByText("Select a client type.", {
					selector: '[role="alert"]',
				})
			).toBeTruthy();
		});
		expect(
			screen.queryByText(/Select Yes/, { selector: '[role="alert"]' })
		).toBeNull();
		expect(
			screen.getByRole("link", { name: "Select a client type." }).getAttribute("href")
		).toBe("#client-type-control");
		expect(screen.queryByRole("link", { name: /Select Yes/ })).toBeNull();
	});

	it("shows the PKCE error for a public client that does not support PKCE", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: { ...environment, config: { clientType: "public", pkceSupported: false } },
			error: null,
			isLoading: false,
		});

		render(<EnvironmentClientTypePage />);
		fireEvent.submit(
			screen.getByRole("button", { name: "Save changes" }).closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(
				screen.getByText(
					"Select Yes to confirm that your environment supports PKCE using at least the S256 hashing algorithm.",
					{ selector: '[role="alert"]' }
				)
			).toBeTruthy();
		});
		expect(
			screen.queryByText("Select a client type.", {
			selector: '[role="alert"]',
		})
		).toBeNull();
		expect(
			screen
				.getByRole("link", {
					name: "Select Yes to confirm that your environment supports PKCE using at least the S256 hashing algorithm.",
				})
				.getAttribute("href")
		).toBe("#pkce-supported-control");
		expect(screen.queryByRole("link", { name: "Select a client type." })).toBeNull();
	});
});