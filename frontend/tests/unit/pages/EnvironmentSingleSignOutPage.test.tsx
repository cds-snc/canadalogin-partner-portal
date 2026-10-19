import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvironmentSingleSignOutPage } from "@/features/application-environments/pages/EnvironmentSingleSignOutPage";

const {
	mockedNavigate,
	mockedUpdateEnvironmentSingleSignOut,
	mockedUseApplicationEnvironment,
	mockedUseApplicationEnvironments,
} = vi.hoisted(() => ({
	mockedNavigate: vi.fn(),
	mockedUpdateEnvironmentSingleSignOut: vi.fn(),
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
				"applicationEnvironmentConnect.backChannel": "Back-channel logout",
				"applicationEnvironmentConnect.frontChannel": "Front-channel logout",
				"applicationEnvironmentConnect.stepTwo.logoutMethod": "Logout method",
				"applicationEnvironmentConnect.stepTwo.signOutRequestUrl":
					"Sign-out request URL",
				"applicationEnvironmentConnect.stepTwo.singleSignOut":
					"Does your application support single sign-out?",
				"applicationEnvironmentConnect.stepTwo.validationLogoutMethod":
					"Select a logout method.",
				"applicationEnvironmentConnect.stepTwo.validationSignOutRequestUrl":
					"Enter a valid sign-out request URL.",
				"applicationEnvironmentConnect.stepTwo.validationSingleSignOut":
					"Select whether your application supports single sign-out.",
				"applicationEnvironmentManagement.cancel": "Cancel",
				"applicationEnvironmentManagement.changeSingleSignOutMethod":
					"Change single sign out method",
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
			isUpdatingSingleSignOut: false,
			singleSignOutUpdateError: null,
			updateEnvironmentSingleSignOut:
				mockedUpdateEnvironmentSingleSignOut,
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
			onInput?: React.FormEventHandler<Element>;
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
							type="radio"
							value={option.value}
							onInput={onInput}
						/>
					</label>
				))}
				{errorMessage ? <span data-error={errorMessage} /> : null}
			</fieldset>
		),
		Text: passthrough,
	};
});

describe("EnvironmentSingleSignOutPage", () => {
	const enabledEnvironment = {
		config: {
			logoutMethod: "front_channel",
			signOutRequestUrl: "https://example.com/sign-out",
			singleSignOut: true,
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
		mockedUpdateEnvironmentSingleSignOut.mockResolvedValue(
			enabledEnvironment
		);
	});

	it("hydrates enabled settings and submits one atomic payload", async () => {
		render(<EnvironmentSingleSignOutPage />);

		expect(
			screen.getByRole("heading", {
				name: "Change single sign out method",
			})
		).toBeTruthy();
		expect(
			screen.getByText("Does your application support single sign-out?")
		).toBeTruthy();
		expect(screen.getByRole("radio", { name: "Yes" })).toBeTruthy();
		expect(screen.getByRole("radio", { name: "Front-channel logout" })).toBeTruthy();
		expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
			"https://example.com/sign-out"
		);

		fireEvent.input(screen.getByRole("radio", { name: "Back-channel logout" }));
		fireEvent.input(screen.getByRole("textbox"), {
			target: { value: "https://new.example.com/sign-out" },
		});
		fireEvent.submit(screen.getByRole("textbox").closest("form") as HTMLFormElement);

		await waitFor(() => {
			expect(mockedUpdateEnvironmentSingleSignOut).toHaveBeenCalledWith({
				environmentUuid: "environment-uuid-1",
				logoutMethod: "back_channel",
				signOutRequestUrl: "https://new.example.com/sign-out",
				singleSignOut: true,
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

	it("clears dependent fields and submits a disabled payload when No is selected", async () => {
		render(<EnvironmentSingleSignOutPage />);

		fireEvent.input(screen.getByRole("radio", { name: "No" }));

		expect(screen.queryByRole("radio", { name: "Front-channel logout" })).toBeNull();
		expect(screen.queryByRole("textbox")).toBeNull();
		fireEvent.submit(screen.getByRole("button", { name: "Save changes" }).closest("form") as HTMLFormElement);

		await waitFor(() => {
			expect(mockedUpdateEnvironmentSingleSignOut).toHaveBeenCalledWith({
				environmentUuid: "environment-uuid-1",
				singleSignOut: false,
			});
		});
	});

	it("shows inline errors, matching summary links, and keeps Cancel pointed at environment management", async () => {
		render(<EnvironmentSingleSignOutPage />);

		fireEvent.input(screen.getByRole("textbox"), {
			target: { value: "not-a-url" },
		});
		fireEvent.input(screen.getByRole("radio", { name: "Front-channel logout" }));
		fireEvent.submit(screen.getByRole("textbox").closest("form") as HTMLFormElement);

		await waitFor(() => {
			expect(screen.getByTestId("error-summary")).toBeTruthy();
		});
		expect(
			screen
				.getByRole("link", { name: "Enter a valid sign-out request URL." })
				.getAttribute("href")
		).toBe("#sign-out-request-url-control");
		expect(
			screen
				.getByLabelText("Sign-out request URL")
				.parentElement?.getAttribute("data-error")
		).toBe("Enter a valid sign-out request URL.");
		expect(mockedUpdateEnvironmentSingleSignOut).not.toHaveBeenCalled();
		expect(
			screen.getByRole("link", { name: "Cancel" }).getAttribute("href")
		).toBe("/applications/application-uuid-1/environments/environment-uuid-1");
	});

	it("shows inline errors and summary links for missing dependent settings", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: {
				...enabledEnvironment,
				config: {
					...enabledEnvironment.config,
					logoutMethod: undefined,
					signOutRequestUrl: "",
				},
			},
			error: null,
			isLoading: false,
		});

		render(<EnvironmentSingleSignOutPage />);
		expect(
			screen.getByRole("button", { name: "Save changes" }).closest("form")
			?.hasAttribute("novalidate")
		).toBe(true);
		fireEvent.input(screen.getByRole("textbox"), {
			target: { value: "not-a-url" },
		});
		fireEvent.submit(
			screen.getByRole("button", { name: "Save changes" }).closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(screen.getByTestId("error-summary")).toBeTruthy();
		});
		expect(
			screen
				.getByRole("link", { name: "Select a logout method." })
				.getAttribute("href")
		).toBe("#logout-method-control");
		expect(
			screen
				.getByRole("group", { name: "Logout method" })
				.querySelector("[data-error]")
				?.getAttribute("data-error")
		).toBe("Select a logout method.");
		expect(
			screen
				.getByRole("link", { name: "Enter a valid sign-out request URL." })
				.getAttribute("href")
		).toBe("#sign-out-request-url-control");
		expect(mockedUpdateEnvironmentSingleSignOut).not.toHaveBeenCalled();
	});
});