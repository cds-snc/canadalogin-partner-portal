import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvironmentRequestsEncryptedPage } from "@/features/application-environments/pages/EnvironmentRequestsEncryptedPage";

const {
	mockedNavigate,
	mockedUpdateEnvironmentEncryption,
	mockedUseApplicationEnvironment,
	mockedUseApplicationEnvironments,
} = vi.hoisted(() => ({
	mockedNavigate: vi.fn(),
	mockedUpdateEnvironmentEncryption: vi.fn(),
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
				"applicationEnvironmentConnect.stepFour.canEncryptRequests":
					"Can your environment encrypt requests?",
				"applicationEnvironmentConnect.stepFour.encryptionContentAlgorithms":
					"Which encryption algorithm can it use to encrypt requests?",
				"applicationEnvironmentConnect.stepFour.encryptionKeyAlgorithms":
					"Which key management algorithm can it use to encrypt requests?",
				"applicationEnvironmentConnect.stepFour.encryptionTitle":
					"Encrypt requests sent to CanadaLogin",
				"applicationEnvironmentConnect.stepFour.validationCanEncryptRequests":
					"Select whether your environment can encrypt requests.",
				"applicationEnvironmentConnect.stepFour.validationEncryptionContentAlgorithms":
					"Select one encryption content algorithm.",
				"applicationEnvironmentConnect.stepFour.validationEncryptionKeyAlgorithms":
					"Select one encryption key algorithm.",
				"applicationEnvironmentManagement.cancel": "Cancel",
				"applicationEnvironmentManagement.changeRequestsEncrypted":
					"Change requests encrypted",
				"applicationEnvironmentManagement.encryptionEditorIntro":
					"Choose which requests your application encrypts and the algorithms it supports.",
				"applicationEnvironmentManagement.encryptionEditorLearnMore":
					"Learn more about request encryption.",
				"applicationEnvironmentManagement.errorBody":
					"The environment could not be loaded.",
				"applicationEnvironmentManagement.errorTitle":
					"Unable to load environment",
				"applicationEnvironmentManagement.loadingBody":
					"Loading the environment configuration.",
				"applicationEnvironmentManagement.loadingTitle":
					"Loading environment",
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
			encryptionUpdateError: null,
			isUpdatingEncryption: false,
			updateEnvironmentEncryption: mockedUpdateEnvironmentEncryption,
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

describe("EnvironmentRequestsEncryptedPage", () => {
	const enabledEnvironment = {
		config: {
			canEncryptRequests: true,
			encryptionKeyAlgorithms: ["RSA-OAEP" as const],
			encryptionContentAlgorithms: ["A256GCM" as const],
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
		mockedUpdateEnvironmentEncryption.mockResolvedValue(enabledEnvironment);
	});

	it("hydrates encryption settings and submits enabled values atomically", async () => {
		render(<EnvironmentRequestsEncryptedPage />);

		expect(
			screen.getByRole("heading", { name: "Change requests encrypted" })
		).toBeTruthy();
		expect(
			screen.getByText(
				"Choose which requests your application encrypts and the algorithms it supports."
			)
		).toBeTruthy();
		expect(screen.getByText("Learn more about request encryption.")).toBeTruthy();
		expect(
			(screen.getByRole("radio", { name: "Yes" }) as HTMLInputElement).checked
		).toBe(true);
		expect(
			(screen.getByRole("radio", { name: "RSA-OAEP" }) as HTMLInputElement)
				.checked
		).toBe(true);
		expect(
			(screen.getByRole("radio", { name: "RSA-OAEP-256" }) as HTMLInputElement)
				.checked
		).toBe(false);
		expect(
			(screen.getByRole("radio", { name: "A256GCM" }) as HTMLInputElement)
				.checked
		).toBe(true);
		expect(
			(screen.getByRole("radio", { name: "A128GCM" }) as HTMLInputElement)
				.checked
		).toBe(false);

		fireEvent.click(screen.getByRole("radio", { name: "RSA-OAEP-256" }));
		fireEvent.click(screen.getByRole("radio", { name: "A128GCM" }));
		fireEvent.submit(
			screen
				.getByRole("button", { name: "Save changes" })
				.closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(mockedUpdateEnvironmentEncryption).toHaveBeenCalledWith({
				environmentUuid: "environment-uuid-1",
				canEncryptRequests: true,
				encryptionKeyAlgorithms: ["RSA-OAEP-256"],
				encryptionContentAlgorithms: ["A128GCM"],
			});
		});
		expect(mockedNavigate).toHaveBeenCalled();
	});

	it("clears encryption selections when No is selected", async () => {
		render(<EnvironmentRequestsEncryptedPage />);

		fireEvent.click(screen.getByRole("radio", { name: "No" }));
		expect(screen.queryByRole("checkbox", { name: "RSA-OAEP" })).toBeNull();

		fireEvent.submit(
			screen
				.getByRole("button", { name: "Save changes" })
				.closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(mockedUpdateEnvironmentEncryption).toHaveBeenCalledWith({
				environmentUuid: "environment-uuid-1",
				canEncryptRequests: false,
				encryptionKeyAlgorithms: [],
				encryptionContentAlgorithms: [],
			});
		});
	});

	it("shows matching summary links when the capability is unset", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: {
				...enabledEnvironment,
				config: {
					canEncryptRequests: undefined,
					encryptionKeyAlgorithms: [],
					encryptionContentAlgorithms: [],
				},
			},
			error: null,
			isLoading: false,
		});

		render(<EnvironmentRequestsEncryptedPage />);
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
				name: "Select whether your environment can encrypt requests.",
			})
			.getAttribute("href")
		).toBe("#can-encrypt-requests-control");
		expect(mockedUpdateEnvironmentEncryption).not.toHaveBeenCalled();
	});

	it("shows matching summary links for empty enabled groups", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: {
				...enabledEnvironment,
				config: {
					canEncryptRequests: true,
					encryptionKeyAlgorithms: [],
					encryptionContentAlgorithms: [],
				},
			},
			error: null,
			isLoading: false,
		});

		render(<EnvironmentRequestsEncryptedPage />);
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
					name: "Select one encryption key algorithm.",
			})
			.getAttribute("href")
		).toBe("#encryption-key-algorithms-control");
		expect(
			screen
			.getByRole("link", {
					name: "Select one encryption content algorithm.",
			})
			.getAttribute("href")
		).toBe("#encryption-content-algorithms-control");
		expect(
			screen
			.getByRole("group", {
				name: "Which key management algorithm can it use to encrypt requests?",
			})
			.getAttribute("data-error")
		).toBe("Select one encryption key algorithm.");
		expect(mockedUpdateEnvironmentEncryption).not.toHaveBeenCalled();
	});
});
