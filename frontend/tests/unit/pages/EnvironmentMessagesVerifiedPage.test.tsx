import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvironmentMessagesVerifiedPage } from "@/features/application-environments/pages/EnvironmentMessagesVerifiedPage";

const {
	mockedNavigate,
	mockedUpdateEnvironmentVerification,
	mockedUseApplicationEnvironment,
	mockedUseApplicationEnvironments,
} = vi.hoisted(() => ({
	mockedNavigate: vi.fn(),
	mockedUpdateEnvironmentVerification: vi.fn(),
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
				"applicationEnvironmentConnect.stepFour.verificationAlgorithms":
					"Which signature algorithms can it use to verify messages?",
				"applicationEnvironmentConnect.stepFour.validationVerificationAlgorithms":
					"Select at least one verification algorithm.",
				"applicationEnvironmentConnect.stepFour.validationVerificationMessages":
					"Select at least one message type to verify.",
				"applicationEnvironmentConnect.stepFour.verificationMessages":
					"Which messages can your environment verify?",
				"applicationEnvironmentConnect.stepFour.verificationTitle":
					"Verify messages from CanadaLogin",
				"applicationEnvironmentConnect.userinfo": "UserInfo",
				"applicationEnvironmentManagement.cancel": "Cancel",
				"applicationEnvironmentManagement.changeMessagesVerified":
					"Change messages verified",
				"applicationEnvironmentManagement.errorBody":
					"The environment could not be loaded.",
				"applicationEnvironmentManagement.errorTitle":
					"Unable to load environment",
				"applicationEnvironmentManagement.loadingBody":
					"Loading the environment configuration.",
				"applicationEnvironmentManagement.loadingTitle": "Loading environment",
				"applicationEnvironmentManagement.saveChanges": "Save changes",
				"applicationEnvironmentManagement.verificationEditorIntro":
					"Choose which messages your application verifies and the algorithms it supports.",
				"applicationEnvironmentManagement.verificationEditorLearnMore":
					"Learn more about message verification.",
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
			isUpdatingVerification: false,
			updateEnvironmentVerification: mockedUpdateEnvironmentVerification,
			verificationUpdateError: null,
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
			onInput: React.FormEventHandler<Element>;
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
								onInput({
									target: { value: nextValue },
								} as unknown as React.FormEvent<Element>);
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
		Text: passthrough,
	};
});

describe("EnvironmentMessagesVerifiedPage", () => {
	const enabledEnvironment = {
		config: {
			verificationMessages: ["id_token" as const],
			verificationSignatureAlgorithms: ["RS256" as const, "PS256" as const],
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
		mockedUpdateEnvironmentVerification.mockResolvedValue(enabledEnvironment);
	});

	it("hydrates both verification groups and submits them atomically", async () => {
		render(<EnvironmentMessagesVerifiedPage />);

		expect(
			screen.getByRole("heading", { name: "Change messages verified" })
		).toBeTruthy();
		expect(
			screen.getByText("Which messages can your environment verify?")
		).toBeTruthy();
		expect(
			(screen.getByRole("checkbox", { name: "ID token" }) as HTMLInputElement)
				.checked
		).toBe(true);
		expect(
			(screen.getByRole("checkbox", { name: "UserInfo" }) as HTMLInputElement)
				.checked
		).toBe(false);
		expect(
			(screen.getByRole("checkbox", { name: "RS256" }) as HTMLInputElement)
				.checked
		).toBe(true);
		expect(
			(screen.getByRole("checkbox", { name: "PS256" }) as HTMLInputElement)
				.checked
		).toBe(true);

		fireEvent.click(screen.getByRole("checkbox", { name: "UserInfo" }));
		fireEvent.submit(
			screen
				.getByRole("button", { name: "Save changes" })
				.closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(mockedUpdateEnvironmentVerification).toHaveBeenCalledWith({
				environmentUuid: "environment-uuid-1",
				verificationMessages: ["id_token", "userinfo"],
				verificationSignatureAlgorithms: ["RS256", "PS256"],
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

	it("shows inline errors and matching summary links for empty groups", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: {
				...enabledEnvironment,
				config: {
					verificationMessages: [],
					verificationSignatureAlgorithms: [],
				},
			},
			error: null,
			isLoading: false,
		});

		render(<EnvironmentMessagesVerifiedPage />);
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
					name: "Select at least one message type to verify.",
				})
				.getAttribute("href")
		).toBe("#verification-messages-control");
		expect(
			screen
				.getByRole("link", {
					name: "Select at least one verification algorithm.",
				})
				.getAttribute("href")
		).toBe("#verification-algorithms-control");
		expect(
			screen
				.getByRole("group", {
					name: "Which messages can your environment verify?",
				})
				.getAttribute("data-error")
		).toBe("Select at least one message type to verify.");
		expect(mockedUpdateEnvironmentVerification).not.toHaveBeenCalled();
	});
});
