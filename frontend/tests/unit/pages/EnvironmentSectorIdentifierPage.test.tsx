import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvironmentSectorIdentifierPage } from "@/features/application-environments/pages/EnvironmentSectorIdentifierPage";

const {
	mockedNavigate,
	mockedUpdateEnvironmentSectorIdentifier,
	mockedUseApplicationEnvironment,
	mockedUseApplicationEnvironments,
} = vi.hoisted(() => ({
	mockedNavigate: vi.fn(),
	mockedUpdateEnvironmentSectorIdentifier: vi.fn(),
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
				"applicationEnvironmentConnect.stepThree.sectorIdentifierUrl":
					"Sector identifier URL",
				"applicationEnvironmentConnect.stepThree.sharesIdentifier":
					"Do users need the same pairwise identifier across multiple applications?",
				"applicationEnvironmentConnect.stepThree.validationSectorIdentifierUrl":
					"Enter a valid sector identifier URL.",
				"applicationEnvironmentConnect.stepThree.validationSharesIdentifier":
					"Select whether users need the same pairwise identifier across multiple applications.",
				"applicationEnvironmentManagement.cancel": "Cancel",
				"applicationEnvironmentManagement.changeSectorIdentifier":
					"Change sector identifier",
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
			isUpdatingSectorIdentifier: false,
			sectorIdentifierUpdateError: null,
			updateEnvironmentSectorIdentifier:
				mockedUpdateEnvironmentSectorIdentifier,
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
				<input id={inputId} name={name} value={value ?? ""} onInput={onInput} />
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

describe("EnvironmentSectorIdentifierPage", () => {
	const enabledEnvironment = {
		config: {
			sectorIdentifierUrl: "https://example.com/sector",
			sharesIdentifier: true,
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
		mockedUpdateEnvironmentSectorIdentifier.mockResolvedValue(
			enabledEnvironment
		);
	});

	it("hydrates the sector identifier settings and submits an enabled payload", async () => {
		render(<EnvironmentSectorIdentifierPage />);

		expect(
			screen.getByRole("heading", { name: "Change sector identifier" })
		).toBeTruthy();
		expect(
			screen.getByText(
				"Do users need the same pairwise identifier across multiple applications?"
			)
		).toBeTruthy();
		expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
			"https://example.com/sector"
		);

		fireEvent.input(screen.getByRole("textbox"), {
			target: { value: "https://new.example.com/sector" },
		});
		fireEvent.submit(
			screen.getByRole("textbox").closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(mockedUpdateEnvironmentSectorIdentifier).toHaveBeenCalledWith({
				environmentUuid: "environment-uuid-1",
				sectorIdentifierUrl: "https://new.example.com/sector",
				sharesIdentifier: true,
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

	it("clears the URL and submits a disabled payload when No is selected", async () => {
		render(<EnvironmentSectorIdentifierPage />);

		fireEvent.input(screen.getByRole("radio", { name: "No" }));

		expect(screen.queryByRole("textbox")).toBeNull();
		fireEvent.submit(
			screen
				.getByRole("button", { name: "Save changes" })
				.closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(mockedUpdateEnvironmentSectorIdentifier).toHaveBeenCalledWith({
				environmentUuid: "environment-uuid-1",
				sectorIdentifierUrl: null,
				sharesIdentifier: false,
			});
		});
	});

	it("shows the URL inline error and matching summary link", async () => {
		render(<EnvironmentSectorIdentifierPage />);

		fireEvent.input(screen.getByRole("textbox"), {
			target: { value: "not-a-url" },
		});
		fireEvent.submit(
			screen.getByRole("textbox").closest("form") as HTMLFormElement
		);

		await waitFor(() => {
			expect(screen.getByTestId("error-summary")).toBeTruthy();
		});
		expect(
			screen
				.getByRole("link", { name: "Enter a valid sector identifier URL." })
				.getAttribute("href")
		).toBe("#sector-identifier-url-control");
		expect(
			screen
				.getByLabelText("Sector identifier URL")
				.parentElement?.getAttribute("data-error")
		).toBe("Enter a valid sector identifier URL.");
		expect(mockedUpdateEnvironmentSectorIdentifier).not.toHaveBeenCalled();
	});
});
