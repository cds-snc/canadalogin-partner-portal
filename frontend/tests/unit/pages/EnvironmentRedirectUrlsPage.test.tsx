import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvironmentRedirectUrlsPage } from "@/features/application-environments/pages/EnvironmentRedirectUrlsPage";

const {
	mockedNavigate,
	mockedUpdateEnvironmentRedirectUris,
	mockedUseApplicationEnvironment,
	mockedUseApplicationEnvironments,
} = vi.hoisted(() => ({
	mockedNavigate: vi.fn(),
	mockedUpdateEnvironmentRedirectUris: vi.fn(),
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
		t: (key: string, options?: { count?: number }): string => {
			const translations: Record<string, string> = {
				"applicationEnvironmentConnect.applicationNameFallback":
					"this application",
				"applicationEnvironmentConnect.stepTwo.addRedirectUri":
					"Add redirect URL",
				"applicationEnvironmentConnect.stepTwo.redirectUrl": `Redirect URL ${options?.count ?? 1}`,
				"applicationEnvironmentConnect.stepTwo.redirectUrlsHint":
					"Where CanadaLogin can send authentication responses.",
				"applicationEnvironmentConnect.stepTwo.redirectUrlsTitle":
					"Redirect URLs",
				"applicationEnvironmentConnect.stepTwo.validationRedirectUrl":
					"Enter a valid redirect URL.",
				"applicationEnvironmentManagement.cancel": "Cancel",
				"applicationEnvironmentManagement.changeRedirectUrls":
					"Change redirect URLs",
				"applicationEnvironmentManagement.errorBody":
					"The environment could not be loaded.",
				"applicationEnvironmentManagement.errorTitle":
					"Unable to load environment",
				"applicationEnvironmentManagement.loadingBody":
					"Loading the environment configuration.",
				"applicationEnvironmentManagement.loadingTitle": "Loading environment",
				"applicationEnvironmentManagement.redirectUrlsIntro":
					"CanadaLogin only redirects users to URLs registered for this environment.",
				"applicationEnvironmentManagement.redirectUrlsRequirementsLink":
					"Learn more about redirect URL requirements.",
				"applicationEnvironmentManagement.saveChanges": "Save changes",
				"common.remove": "Remove",
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
			isUpdatingRedirectUris: false,
			redirectUrisUpdateError: null,
			updateEnvironmentRedirectUris: mockedUpdateEnvironmentRedirectUris,
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
			onGcdsClick,
			type,
		}: PropsWithChildren<{
			disabled?: boolean;
			onGcdsClick?: () => void;
			type?: "button" | "submit";
		}>): ReactElement => (
			<button
			disabled={disabled}
			type={type}
			onClick={() => onGcdsClick?.()}
		>
				{children}
			</button>
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
		Fieldset: passthrough,
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
				<input id={inputId} name={name} value={value} onInput={onInput} />
			</label>
		),
		Link: ({
			children,
			href,
			onGcdsClick,
		}: PropsWithChildren<{
			href: string;
			onGcdsClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
		}>): ReactElement => (
			<a
			href={href}
			onClick={(event) => onGcdsClick?.(event)}
		>
				{children}
			</a>
		),
		Notice: passthrough,
		Text: passthrough,
	};
});

describe("EnvironmentRedirectUrlsPage", () => {
	const environment = {
		config: {
			redirectUris: [
				"https://example.com/callback",
				"https://example.com/alternate-callback",
			],
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
		mockedUpdateEnvironmentRedirectUris.mockResolvedValue(environment);
	});

	it("hydrates, adds, removes, and submits redirect URLs", async () => {
		render(<EnvironmentRedirectUrlsPage />);

		expect(
			screen.getByRole("heading", { name: "Change redirect URLs" })
		).toBeTruthy();
		expect(
			screen.getByText(
				"CanadaLogin only redirects users to URLs registered for this environment."
			)
		).toBeTruthy();
		expect(screen.getAllByRole("textbox")).toHaveLength(2);
		expect(
		(screen.getAllByRole("textbox")[0] as HTMLInputElement).value
		).toBe("https://example.com/callback");

		fireEvent.click(screen.getByRole("button", { name: "Add redirect URL" }));
		expect(screen.getAllByRole("textbox")).toHaveLength(3);

		const removeLink = screen.getAllByRole("link", { name: "Remove" })[0];
		if (!removeLink) {
			throw new Error("Expected a remove link");
		}
		fireEvent.click(removeLink);
		expect(screen.getAllByRole("textbox")).toHaveLength(2);

		const textboxes = screen.getAllByRole("textbox");
		const firstInput = textboxes[0];
		const secondInput = textboxes[1];
		if (!firstInput || !secondInput) {
			throw new Error("Expected two redirect URL inputs");
		}
		fireEvent.input(firstInput, {
			target: { value: "https://new.example.com/callback" },
		});
		fireEvent.input(secondInput, {
			target: { value: "https://new.example.com/alternate-callback" },
		});
		fireEvent.submit(firstInput.closest("form") as HTMLFormElement);

		await waitFor(() => {
			expect(mockedUpdateEnvironmentRedirectUris).toHaveBeenCalledWith({
				environmentUuid: "environment-uuid-1",
				redirectUris: [
					"https://new.example.com/callback",
					"https://new.example.com/alternate-callback",
				],
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

	it("requires every redirect URL to be valid before submitting", async () => {
		render(<EnvironmentRedirectUrlsPage />);

		const input = screen.getAllByRole("textbox")[0];
		if (!input) {
			throw new Error("Expected a redirect URL input");
		}
		fireEvent.input(input, { target: { value: "not-a-url" } });
		fireEvent.submit(input.closest("form") as HTMLFormElement);

		await waitFor(() => {
			expect(screen.getByTestId("error-summary")).toBeTruthy();
		});
		expect(mockedUpdateEnvironmentRedirectUris).not.toHaveBeenCalled();
	});

	it("links cancel back to environment management", () => {
		render(<EnvironmentRedirectUrlsPage />);

		expect(
			screen.getByRole("link", { name: "Cancel" }).getAttribute("href")
		).toBe(
			"/applications/application-uuid-1/environments/environment-uuid-1"
		);
	});
});