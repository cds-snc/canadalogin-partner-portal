import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvironmentMessagesSignedPage } from "@/features/application-environments/pages/EnvironmentMessagesSignedPage";

const {
	mockedNavigate,
	mockedUpdateEnvironmentSigning,
	mockedUseApplicationEnvironment,
	mockedUseApplicationEnvironments,
} = vi.hoisted(() => ({
	mockedNavigate: vi.fn(),
	mockedUpdateEnvironmentSigning: vi.fn(),
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
				"applicationEnvironmentConnect.requestObject": "Request object",
				"applicationEnvironmentConnect.stepFour.canSignMessages":
					"Can your environment sign messages?",
				"applicationEnvironmentConnect.stepFour.signingAlgorithms":
					"Which signature algorithm can it use to sign messages?",
				"applicationEnvironmentConnect.stepFour.signingMessages":
					"Which messages can it sign?",
				"applicationEnvironmentConnect.stepFour.signingTitle":
					"Sign messages sent to CanadaLogin",
				"applicationEnvironmentConnect.stepFour.validationCanSignMessages":
					"Select whether your environment can sign messages.",
				"applicationEnvironmentConnect.stepFour.validationSigningAlgorithms":
					"Select one signing algorithm.",
				"applicationEnvironmentConnect.stepFour.validationSigningMessages":
					"Select at least one message type to sign.",
				"applicationEnvironmentConnect.tokenEndpoint": "Token endpoint",
				"applicationEnvironmentManagement.cancel": "Cancel",
				"applicationEnvironmentManagement.changeMessagesSigned":
					"Change messages signed",
				"applicationEnvironmentManagement.errorBody":
					"The environment could not be loaded.",
				"applicationEnvironmentManagement.errorTitle":
					"Unable to load environment",
				"applicationEnvironmentManagement.loadingBody":
					"Loading the environment configuration.",
				"applicationEnvironmentManagement.loadingTitle":
					"Loading environment",
				"applicationEnvironmentManagement.saveChanges": "Save changes",
				"applicationEnvironmentManagement.signingEditorIntro":
					"Choose which messages CanadaLogin signs and the algorithms it uses.",
				"applicationEnvironmentManagement.signingEditorLearnMore":
					"Learn more about message signing.",
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
			isUpdatingSigning: false,
			signingUpdateError: null,
			updateEnvironmentSigning: mockedUpdateEnvironmentSigning,
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
		Checkboxes: ({
			errorMessage,
			id,
			legend,
			name,
			onInput,
			options,
			value,
		}: {
			errorMessage?: string;
			id: string;
			legend: string;
			name: string;
			onInput: (event: { target: { value: string[] } }) => void;
			options: Array<{ id: string; label: string; value: string }>;
			value: string[];
		}): ReactElement => (
			<fieldset id={id} data-error={errorMessage}>
				<legend>{legend}</legend>
				{options.map((option) => (
					<label key={option.id}>
						{option.label}
						<input
							checked={value.includes(option.value)}
							name={name}
							type="checkbox"
							value={option.value}
							onChange={(event) => {
								const nextValue = event.target.checked
									? [...value, option.value]
									: value.filter((selected) => selected !== option.value);
								onInput({ target: { value: nextValue } });
							}}
						/>
					</label>
				))}
			</fieldset>
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
		Fieldset: passthrough,
		Grid: passthrough,
		Heading: ({
			children,
			tag,
		}: PropsWithChildren<{ tag: "h1" | "h2" | "h3" }>): ReactElement => {
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
			errorMessage?: string;
			id: string;
			legend: string;
			name: string;
			onInput: (event: { target: { value: string } }) => void;
			options: Array<{ id: string; label: string; value: string }>;
			value?: string;
		}): ReactElement => (
			<fieldset id={id} data-error={errorMessage}>
				<legend>{legend}</legend>
				{options.map((option) => (
					<label key={option.id}>
						{option.label}
						<input
							checked={value === option.value}
							name={name}
							type="radio"
							value={option.value}
							onChange={() => onInput({ target: { value: option.value } })}
						/>
					</label>
				))}
			</fieldset>
		),
		Text: passthrough,
	};
});

describe("EnvironmentMessagesSignedPage", () => {
	const enabledEnvironment = {
		config: {
			canSignMessages: true,
			signingMessages: ["request_object" as const],
			signingSignatureAlgorithms: ["RS256" as const],
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
			data: enabledEnvironment,
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
		mockedUpdateEnvironmentSigning.mockResolvedValue(enabledEnvironment);
	});

	it("hydrates signing settings and submits enabled values atomically", async () => {
		render(<EnvironmentMessagesSignedPage />);

		expect(
			screen.getByRole("heading", { name: "Change messages signed" })
		).toBeTruthy();
		expect(
			screen.getByText(
				"Choose which messages CanadaLogin signs and the algorithms it uses."
			)
		).toBeTruthy();
		expect(screen.getByText("Learn more about message signing.")).toBeTruthy();
		expect(
			(screen.getByRole("radio", { name: "Yes" }) as HTMLInputElement).checked
		).toBe(true);
		expect(
			(screen.getByRole("checkbox", { name: "Request object" }) as HTMLInputElement)
				.checked
		).toBe(true);
		expect(
			(screen.getByRole("radio", { name: "RS256" }) as HTMLInputElement).checked
		).toBe(true);
		expect(
			(screen.getByRole("radio", { name: "PS256" }) as HTMLInputElement).checked
		).toBe(false);

		fireEvent.click(screen.getByRole("checkbox", { name: "Token endpoint" }));
		fireEvent.click(screen.getByRole("radio", { name: "PS256" }));
		fireEvent.submit(
			screen
				.getByRole("button", { name: "Save changes" })
				.closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(mockedUpdateEnvironmentSigning).toHaveBeenCalledWith({
				environmentUuid: "environment-uuid-1",
				canSignMessages: true,
				signingMessages: ["request_object", "token_endpoint"],
				signingSignatureAlgorithms: ["PS256"],
			});
		});
		expect(mockedNavigate).toHaveBeenCalled();
	});

	it("clears signing selections when No is selected", async () => {
		render(<EnvironmentMessagesSignedPage />);

		fireEvent.click(screen.getByRole("radio", { name: "No" }));
		expect(screen.queryByRole("checkbox", { name: "Request object" })).toBeNull();

		fireEvent.submit(
			screen
				.getByRole("button", { name: "Save changes" })
				.closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(mockedUpdateEnvironmentSigning).toHaveBeenCalledWith({
				environmentUuid: "environment-uuid-1",
				canSignMessages: false,
				signingMessages: [],
				signingSignatureAlgorithms: [],
			});
		});
	});

	it("shows matching summary links when the capability is unset", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: {
				...enabledEnvironment,
				config: {
					canSignMessages: undefined,
					signingMessages: [],
					signingSignatureAlgorithms: [],
				},
			},
			error: null,
			isLoading: false,
		});

		render(<EnvironmentMessagesSignedPage />);
		fireEvent.submit(
			screen
				.getByRole("button", { name: "Save changes" })
				.closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(screen.getByTestId("error-summary")).toBeTruthy();
		});
		expect(
			screen
				.getByRole("link", {
					name: "Select whether your environment can sign messages.",
				})
				.getAttribute("href")
		).toBe("#can-sign-messages-control");
		expect(mockedUpdateEnvironmentSigning).not.toHaveBeenCalled();
	});

	it("shows matching summary links for empty enabled groups", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: {
				...enabledEnvironment,
				config: {
					canSignMessages: true,
					signingMessages: [],
					signingSignatureAlgorithms: [],
				},
			},
			error: null,
			isLoading: false,
		});

		render(<EnvironmentMessagesSignedPage />);
		fireEvent.submit(
			screen
				.getByRole("button", { name: "Save changes" })
				.closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(screen.getByTestId("error-summary")).toBeTruthy();
		});
		expect(
			screen
				.getByRole("link", {
					name: "Select at least one message type to sign.",
				})
				.getAttribute("href")
		).toBe("#signing-messages-control");
		expect(
			screen
				.getByRole("link", {
					name: "Select one signing algorithm.",
				})
				.getAttribute("href")
		).toBe("#signing-algorithms-control");
		expect(
			screen
				.getByRole("group", { name: "Which messages can it sign?" })
				.getAttribute("data-error")
		).toBe("Select at least one message type to sign.");
		expect(mockedUpdateEnvironmentSigning).not.toHaveBeenCalled();
	});
});