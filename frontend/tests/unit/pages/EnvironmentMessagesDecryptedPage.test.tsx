import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvironmentMessagesDecryptedPage } from "@/features/application-environments/pages/EnvironmentMessagesDecryptedPage";

const {
	mockedNavigate,
	mockedUpdateEnvironmentDecryption,
	mockedUseApplicationEnvironment,
	mockedUseApplicationEnvironments,
} = vi.hoisted(() => ({
	mockedNavigate: vi.fn(),
	mockedUpdateEnvironmentDecryption: vi.fn(),
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
				"applicationEnvironmentConnect.idToken": "ID token",
				"applicationEnvironmentConnect.stepFour.canDecryptMessages":
					"Can your environment decrypt messages?",
				"applicationEnvironmentConnect.stepFour.decryptionContentAlgorithms":
					"Which encryption algorithm can it use to decrypt messages?",
				"applicationEnvironmentConnect.stepFour.decryptionKeyAlgorithms":
					"Which key management algorithm can it use to decrypt messages?",
				"applicationEnvironmentConnect.stepFour.decryptionMessages":
					"Which messages can it decrypt?",
				"applicationEnvironmentConnect.stepFour.decryptionTitle":
					"Decrypt messages from CanadaLogin",
				"applicationEnvironmentConnect.stepFour.validationCanDecryptMessages":
					"Select whether your environment can decrypt messages.",
				"applicationEnvironmentConnect.stepFour.validationDecryptionContentAlgorithms":
					"Select one decryption content algorithm.",
				"applicationEnvironmentConnect.stepFour.validationDecryptionKeyAlgorithms":
					"Select one decryption key algorithm.",
				"applicationEnvironmentConnect.stepFour.validationDecryptionMessages":
					"Select at least one message type to decrypt.",
				"applicationEnvironmentConnect.stepFour.tokenEndpointResponse":
					"Token endpoint response",
				"applicationEnvironmentConnect.stepFour.userinfo": "UserInfo endpoint",
				"applicationEnvironmentConnect.tokenEndpointResponse":
					"Token endpoint response",
				"applicationEnvironmentConnect.userinfo": "UserInfo endpoint",
				"applicationEnvironmentManagement.cancel": "Cancel",
				"applicationEnvironmentManagement.changeMessagesDecrypted":
					"Change messages decrypted",
				"applicationEnvironmentManagement.decryptionEditorIntro":
					"Choose which encrypted messages your application can decrypt and the algorithms it supports.",
				"applicationEnvironmentManagement.decryptionEditorLearnMore":
					"Learn more about message encryption.",
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
			decryptionUpdateError: null,
			isUpdatingDecryption: false,
			updateEnvironmentDecryption: mockedUpdateEnvironmentDecryption,
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
			<fieldset
				id={id}
				data-error={errorMessage}
				data-option-keys={options
					.map((option) => Object.keys(option).sort().join(","))
					.join(";")}
			>
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

describe("EnvironmentMessagesDecryptedPage", () => {
	const enabledEnvironment = {
		config: {
			canDecryptMessages: true,
			decryptionMessages: ["id_token" as const],
			decryptionKeyAlgorithms: ["RSA-OAEP" as const],
			decryptionContentAlgorithms: ["A256GCM" as const],
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
		mockedUpdateEnvironmentDecryption.mockResolvedValue(enabledEnvironment);
	});

	it("hydrates decryption settings and submits enabled values atomically", async () => {
		render(<EnvironmentMessagesDecryptedPage />);

		expect(
			screen.getByRole("heading", { name: "Change messages decrypted" })
		).toBeTruthy();
		expect(
			screen.getByText(
				"Choose which encrypted messages your application can decrypt and the algorithms it supports."
			)
		).toBeTruthy();
		expect(screen.getByText("Learn more about message encryption.")).toBeTruthy();
		expect(
			(screen.getByRole("radio", { name: "Yes" }) as HTMLInputElement).checked
		).toBe(true);
		const messageGroup = screen.getByRole("group", {
			name: "Which messages can it decrypt?",
		});
		expect(messageGroup).toBeTruthy();
		expect(messageGroup.getAttribute("data-option-keys")).toBe(
			"id,label,value;id,label,value;id,label,value"
		);
		expect(
			(screen.getByRole("checkbox", { name: "ID token" }) as HTMLInputElement)
				.checked
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

		fireEvent.click(screen.getByRole("checkbox", { name: "UserInfo endpoint" }));
		fireEvent.click(screen.getByRole("radio", { name: "RSA-OAEP-256" }));
		fireEvent.click(screen.getByRole("radio", { name: "A128GCM" }));
		fireEvent.submit(
			screen
				.getByRole("button", { name: "Save changes" })
				.closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(mockedUpdateEnvironmentDecryption).toHaveBeenCalledWith({
				environmentUuid: "environment-uuid-1",
				canDecryptMessages: true,
				decryptionMessages: ["id_token", "userinfo"],
				decryptionKeyAlgorithms: ["RSA-OAEP-256"],
				decryptionContentAlgorithms: ["A128GCM"],
			});
		});
		expect(mockedNavigate).toHaveBeenCalled();
	});

	it("clears decryption selections when No is selected", async () => {
		render(<EnvironmentMessagesDecryptedPage />);

		fireEvent.click(screen.getByRole("radio", { name: "No" }));
		expect(screen.queryByRole("checkbox", { name: "ID token" })).toBeNull();

		fireEvent.submit(
			screen
				.getByRole("button", { name: "Save changes" })
				.closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(mockedUpdateEnvironmentDecryption).toHaveBeenCalledWith({
				environmentUuid: "environment-uuid-1",
				canDecryptMessages: false,
				decryptionMessages: [],
				decryptionKeyAlgorithms: [],
				decryptionContentAlgorithms: [],
			});
		});
	});

	it("shows the message question when Yes is selected", () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: {
				...enabledEnvironment,
				config: {
					canDecryptMessages: false,
					decryptionMessages: [],
					decryptionKeyAlgorithms: [],
					decryptionContentAlgorithms: [],
				},
			},
			error: null,
			isLoading: false,
		});

		render(<EnvironmentMessagesDecryptedPage />);

		expect(
			screen.queryByRole("group", { name: "Which messages can it decrypt?" })
		).toBeNull();

		fireEvent.click(screen.getByRole("radio", { name: "Yes" }));

		expect(
			screen.getByRole("group", { name: "Which messages can it decrypt?" })
		).toBeTruthy();
	});

	it("shows summary links for invalid enabled selections", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: {
				...enabledEnvironment,
				config: {
					canDecryptMessages: true,
					decryptionMessages: [],
					decryptionKeyAlgorithms: [],
					decryptionContentAlgorithms: [],
				},
			},
			error: null,
			isLoading: false,
		});

		render(<EnvironmentMessagesDecryptedPage />);
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
				name: "Select at least one message type to decrypt.",
			})
			.getAttribute("href")
		).toBe("#decryption-messages-control");
		expect(
			screen
			.getByRole("link", {
					name: "Select one decryption key algorithm.",
			})
			.getAttribute("href")
		).toBe("#decryption-key-algorithms-control");
		expect(
			screen
			.getByRole("group", {
					name: "Which encryption algorithm can it use to decrypt messages?",
			})
			.getAttribute("data-error")
		).toBe("Select one decryption content algorithm.");
		expect(mockedUpdateEnvironmentDecryption).not.toHaveBeenCalled();
	});
});
