import type { PropsWithChildren, ReactElement } from "react";
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConnectEnvironmentPage } from "@/features/application-environments/pages/ConnectEnvironmentPage";

const {
	mockedCreateEnvironment,
	mockedNavigate,
	mockedScrollIntoView,
	mockedUseApplicationEnvironments,
} = vi.hoisted(() => ({
	mockedCreateEnvironment: vi.fn(),
	mockedNavigate: vi.fn(),
	mockedScrollIntoView: vi.fn(),
	mockedUseApplicationEnvironments: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockedNavigate,
	useParams: () => ({ applicationUuid: "application-uuid-1" }),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { resolvedLanguage: "en" },
		t: (key: string): string => key,
	}),
}));

vi.mock("@/fetch", () => ({
	getRequestErrorNotice: () => null,
}));

vi.mock(
	"@/features/application-environments/hooks/use-application-environments",
	() => ({ useApplicationEnvironments: mockedUseApplicationEnvironments })
);

vi.mock(
	"@/features/application-environments/hooks/use-application-environment-management",
	() => ({
		useApplicationEnvironmentManagement: () => ({
			createEnvironment: mockedCreateEnvironment,
			error: null,
			isCreating: false,
		}),
	})
);

vi.mock("@/components/ui", () => {
	const passthrough = ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	);
	const renderCheckboxes = ({
		errorMessage,
		id,
		legend,
		name,
		onInput,
		options,
		value = [],
	}: {
		errorMessage?: string;
		id?: string;
		legend: string;
		name: string;
		onInput?: (event: {
			target: { name: string; value: Array<string> };
		}) => void;
		options: Array<{ id: string; label: string; value?: string }>;
		value?: Array<string>;
	}): ReactElement => (
		<fieldset data-error={errorMessage} id={id}>
			<legend>{legend}</legend>
			{options.map((option) => {
				const optionValue = option.value ?? option.id;
				const checked = value.includes(optionValue);
				return (
					<label key={option.id}>
						<input
							checked={checked}
							name={name}
							type="checkbox"
							value={optionValue}
							onChange={() => {
								const nextValue = checked
									? value.filter((selected) => selected !== optionValue)
									: [...value, optionValue];
								onInput?.({
									target: { name, value: nextValue },
								});
							}}
						/>
						{option.label}
					</label>
				);
			})}
		</fieldset>
	);
	const renderFieldset = ({
		children,
		legend,
	}: PropsWithChildren<{ legend?: string }>): ReactElement => (
		<fieldset>
			{legend && <legend>{legend}</legend>}
			{children}
		</fieldset>
	);

	return {
		Button: ({
			children,
			onGcdsClick,
			type,
		}: PropsWithChildren<{
			onGcdsClick?: () => void;
			type?: "button" | "submit";
		}>): ReactElement => (
			<button type={type} onClick={onGcdsClick}>
				{children}
			</button>
		),
		Checkboxes: renderCheckboxes,
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
		Fieldset: renderFieldset,
		Grid: passthrough,
		Heading: ({
			children,
			tag,
		}: PropsWithChildren<{ tag: "h1" | "h2" | "h3" }>): ReactElement => {
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
			inputId: string;
			label: string;
			name: string;
			onInput?: React.FormEventHandler<Element>;
			errorMessage?: string;
			id?: string;
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
			legend: string;
			errorMessage?: string;
			id?: string;
			name: string;
			onInput?: React.FormEventHandler<Element>;
			options: Array<{ id: string; label: string; value: string }>;
			value?: string;
		}): ReactElement => (
			<fieldset data-error={errorMessage} id={id}>
				<legend>{legend}</legend>
				{options.map((option) => (
					<label key={option.id}>
						<input
							checked={value === option.value}
							name={name}
							type="radio"
							value={option.value}
							onChange={onInput}
						/>
						{option.label}
					</label>
				))}
			</fieldset>
		),
		Select: ({
			children,
			errorMessage,
			id,
			label,
			name,
			onInput,
			selectId,
			value,
		}: PropsWithChildren<{
			label: string;
			errorMessage?: string;
			id?: string;
			name: string;
			onInput?: React.FormEventHandler<Element>;
			selectId: string;
			value?: string;
		}>): ReactElement => (
			<label data-error={errorMessage} id={id}>
				{label}
				<select id={selectId} name={name} value={value} onChange={onInput}>
					{children}
				</select>
			</label>
		),
		SrOnly: passthrough,
		Stepper: passthrough,
		Text: passthrough,
	};
});

describe("ConnectEnvironmentPage", () => {
	beforeEach(() => {
		mockedCreateEnvironment.mockReset();
		mockedNavigate.mockReset();
		mockedScrollIntoView.mockReset();
		mockedUseApplicationEnvironments.mockReset();
		Object.defineProperty(HTMLFormElement.prototype, "scrollIntoView", {
			configurable: true,
			value: mockedScrollIntoView,
		});
	});

	const applicationSummary = {
		application: {
			nameEn: "Benefits portal",
			nameFr: null,
			uuid: "application-uuid-1",
		},
		data: [],
		hasMore: false,
		itemsPerPage: 100,
		page: 1,
		totalCount: 0,
	};

	const enterStepTwo = async (): Promise<void> => {
		fireEvent.click(
			screen.getByRole("radio", {
				name: "applicationEnvironmentConnect.tenantTest",
			})
		);
		fireEvent.input(
			screen.getByLabelText(
				"applicationEnvironmentConnect.stepOne.environmentName"
			),
			{ target: { value: "portal" } }
		);
		fireEvent.input(
			screen.getByLabelText(
				"applicationEnvironmentConnect.stepOne.applicationUrlEn"
			),
			{ target: { value: "https://en.example.com" } }
		);
		fireEvent.input(
			screen.getByLabelText(
				"applicationEnvironmentConnect.stepOne.applicationUrlFr"
			),
			{ target: { value: "https://fr.example.com" } }
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.continue",
			})
		);
		await waitFor(() => {
			expect(
				screen.getByRole("heading", {
					name: "applicationEnvironmentConnect.stepTwo.title",
				})
			).toBeTruthy();
		});
	};

	const enterStepThree = async (): Promise<void> => {
		await enterStepTwo();
		fireEvent.input(
			screen.getByLabelText(
				"applicationEnvironmentConnect.stepTwo.redirectUrl"
			),
			{ target: { value: "https://example.com/callback" } }
		);
		fireEvent.input(
			screen.getByLabelText(
				"applicationEnvironmentConnect.stepTwo.postLogoutUrl"
			),
			{ target: { value: "https://example.com/logout" } }
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.continue",
			})
		);
		await waitFor(() => {
			expect(
				screen.getByRole("group", {
					name: "applicationEnvironmentConnect.stepThree.clientType",
				})
			).toBeTruthy();
		});
	};

	it("reveals the conditional Step 1 fields in order", () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: {
				application: {
					nameEn: "Benefits portal",
					nameFr: null,
					uuid: "application-uuid-1",
				},
				data: [
					{
						createdAt: "2026-09-17T00:00:00Z",
						partnerLabel: "Existing test configuration",
						statusCode: "draft",
						tenantCode: "test",
						updatedAt: null,
						uuid: "environment-1",
					},
				],
				hasMore: false,
				itemsPerPage: 100,
				page: 1,
				totalCount: 1,
			},
			error: null,
			isLoading: false,
		});

		render(<ConnectEnvironmentPage />);

		expect(
			screen.queryByText("applicationEnvironmentConnect.stepOne.connectionType")
		).toBeNull();
		fireEvent.click(
			screen.getByRole("radio", {
				name: "applicationEnvironmentConnect.tenantTest",
			})
		);

		expect(
			screen.getByText("applicationEnvironmentConnect.stepOne.connectionType")
		).toBeTruthy();
		expect(screen.getByText("TEST-")).toBeTruthy();
		expect(
			screen.getByLabelText(
				"applicationEnvironmentConnect.stepOne.applicationUrlEn"
			)
		).toBeTruthy();
		expect(
			screen.queryByLabelText(
				"applicationEnvironmentConnect.stepOne.sourceEnvironment"
			)
		).toBeNull();

		fireEvent.click(screen.getByRole("radio", { name: "common.yes" }));
		expect(
			screen.getByLabelText(
				"applicationEnvironmentConnect.stepOne.sourceEnvironment"
			)
		).toBeTruthy();

		fireEvent.click(screen.getByRole("radio", { name: "common.no" }));
		expect(
			screen.queryByLabelText(
				"applicationEnvironmentConnect.stepOne.sourceEnvironment"
			)
		).toBeNull();
	});

	it("supports repeatable endpoint fields and progressive sign-out disclosure", async () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: applicationSummary,
			error: null,
			isLoading: false,
		});

		render(<ConnectEnvironmentPage />);
		await enterStepTwo();

		expect(
			screen.getByLabelText("applicationEnvironmentConnect.stepTwo.redirectUrl")
		).toBeTruthy();
		expect(screen.queryByRole("button", { name: "common.remove" })).toBeNull();
		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.stepTwo.addRedirectUri",
			})
		);
		expect(
			screen.getAllByRole("button", { name: "common.remove" })
		).toHaveLength(1);
		expect(document.getElementById("redirect-uri-1")).toBeTruthy();

		expect(
			screen.queryByRole("group", {
				name: "applicationEnvironmentConnect.stepTwo.logoutMethod",
			})
		).toBeNull();
		fireEvent.click(screen.getByRole("radio", { name: "common.yes" }));
		expect(
			screen.getByRole("group", {
				name: "applicationEnvironmentConnect.stepTwo.logoutMethod",
			})
		).toBeTruthy();
		expect(
			screen.getByLabelText(
				"applicationEnvironmentConnect.stepTwo.signOutRequestUrl"
			)
		).toBeTruthy();
		fireEvent.click(screen.getByRole("radio", { name: "common.no" }));
		expect(
			screen.queryByRole("group", {
				name: "applicationEnvironmentConnect.stepTwo.logoutMethod",
			})
		).toBeNull();
	});

	it("preserves entered endpoint values when navigating back", async () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: applicationSummary,
			error: null,
			isLoading: false,
		});

		render(<ConnectEnvironmentPage />);
		await enterStepTwo();
		fireEvent.input(document.getElementById("redirect-uri-0")!, {
			target: { value: "https://example.com/callback" },
		});
		fireEvent.click(screen.getByRole("button", { name: "common.back" }));
		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.continue",
			})
		);
		await waitFor(() => {
			expect(
				(document.getElementById("redirect-uri-0") as HTMLInputElement).value
			).toBe("https://example.com/callback");
		});
	});

	it("hydrates copied configuration and keeps copied rows editable", async () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: {
				...applicationSummary,
				data: [
					{
						createdAt: "2026-09-17T00:00:00Z",
						partnerLabel: "Existing test configuration",
						statusCode: "draft",
						tenantCode: "test",
						updatedAt: null,
						uuid: "environment-1",
						config: {
							applicationUrlEn: "https://en.example.com",
							applicationUrlFr: "https://fr.example.com",
							environmentName: "copied-portal",
							redirectUris: [
								"https://en.example.com/callback",
								"https://en.example.com/callback-2",
							],
							postLogoutRedirectUris: ["https://en.example.com/logout"],
							singleSignOut: true,
							logoutMethod: "back_channel",
							signOutRequestUrl: "https://en.example.com/signout",
							clientType: "public",
							pkceSupported: true,
							sharesIdentifier: true,
							sectorIdentifierUrl: "https://en.example.com/sector.json",
						},
					},
				],
			},
			error: null,
			isLoading: false,
		});

		render(<ConnectEnvironmentPage />);
		fireEvent.click(
			screen.getByRole("radio", {
				name: "applicationEnvironmentConnect.tenantTest",
			})
		);
		fireEvent.click(screen.getByRole("radio", { name: "common.yes" }));
		fireEvent.change(
			screen.getByLabelText(
				"applicationEnvironmentConnect.stepOne.sourceEnvironment"
			),
			{ target: { value: "environment-1" } }
		);
		expect(screen.getByDisplayValue("copied-portal")).toBeTruthy();
		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.continue",
			})
		);
		await waitFor(() => {
			expect(
				(document.getElementById("redirect-uri-1") as HTMLInputElement).value
			).toBe("https://en.example.com/callback-2");
		});
		expect(
			screen.getByDisplayValue("https://en.example.com/signout")
		).toBeTruthy();
		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.continue",
			})
		);
		await waitFor(() => {
			expect(
				(
					screen.getByLabelText(
						"applicationEnvironmentConnect.stepThree.sectorIdentifierUrl"
					) as HTMLInputElement
				).value
			).toBe("https://en.example.com/sector.json");
		});
		expect(
			within(
				screen.getByRole("group", {
					name: "applicationEnvironmentConnect.stepThree.clientType",
				})
			).getByRole("radio", {
				name: "applicationEnvironmentConnect.publicClient",
			})
		).toHaveProperty("checked", true);
		fireEvent.input(
			screen.getByLabelText(
				"applicationEnvironmentConnect.stepThree.sectorIdentifierUrl"
			),
			{ target: { value: "https://example.com/updated-sector.json" } }
		);
		expect(
			(
				screen.getByLabelText(
					"applicationEnvironmentConnect.stepThree.sectorIdentifierUrl"
				) as HTMLInputElement
			).value
		).toBe("https://example.com/updated-sector.json");
	});

	it("shows linked GCDS errors for visible Step 1 fields", async () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: {
				application: {
					nameEn: "Benefits portal",
					nameFr: null,
					uuid: "application-uuid-1",
				},
				data: [
					{
						createdAt: "2026-09-17T00:00:00Z",
						partnerLabel: "Existing test configuration",
						statusCode: "draft",
						tenantCode: "test",
						updatedAt: null,
						uuid: "environment-1",
					},
				],
				hasMore: false,
				itemsPerPage: 100,
				page: 1,
				totalCount: 1,
			},
			error: null,
			isLoading: false,
		});

		render(<ConnectEnvironmentPage />);

		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.continue",
			})
		);
		await waitFor(() => {
			expect(screen.getByTestId("error-summary")).toBeTruthy();
		});
		expect(
			screen
				.getByRole("link", {
					name: "applicationEnvironments.connect.validationEnvironmentType",
				})
				.getAttribute("href")
		).toBe("#tenant-code-control");
		expect(
			document.getElementById("tenant-code-control")?.getAttribute("data-error")
		).toBe("applicationEnvironments.connect.validationEnvironmentType");

		fireEvent.click(
			screen.getByRole("radio", {
				name: "applicationEnvironmentConnect.tenantTest",
			})
		);
		fireEvent.click(screen.getByRole("radio", { name: "common.yes" }));
		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.continue",
			})
		);

		await waitFor(() => {
			expect(
				screen
					.getByRole("link", {
						name: "applicationEnvironments.connect.validationCopyConfiguration",
					})
					.getAttribute("href")
			).toBe("#source-environment-control");
		});
		expect(
			document
				.getElementById("source-environment-control")
				?.getAttribute("data-error")
		).toBe("applicationEnvironments.connect.validationCopyConfiguration");
		expect(
			screen
				.getByRole("link", {
					name: "applicationEnvironments.connect.validationEnvironmentName",
				})
				.getAttribute("href")
		).toBe("#environment-name-control");
	});

	it("shows linked GCDS errors for Step 2 fields", async () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: applicationSummary,
			error: null,
			isLoading: false,
		});

		render(<ConnectEnvironmentPage />);
		await enterStepTwo();

		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.continue",
			})
		);
		await waitFor(() => {
			expect(screen.getByTestId("error-summary")).toBeTruthy();
		});
		expect(
			screen
				.getByRole("link", {
					name: "applicationEnvironmentConnect.stepTwo.validationRedirectUrl",
				})
				.getAttribute("href")
		).toBe("#redirect-uri-control-0");
		expect(
			screen
				.getByRole("link", {
					name: "applicationEnvironmentConnect.stepTwo.validationPostLogoutUrl",
				})
				.getAttribute("href")
		).toBe("#post-logout-redirect-uri-control-0");
		expect(
			document
				.getElementById("redirect-uri-control-0")
				?.getAttribute("data-error")
		).toBe("applicationEnvironmentConnect.stepTwo.validationRedirectUrl");
		expect(
			document
				.getElementById("post-logout-redirect-uri-control-0")
				?.getAttribute("data-error")
		).toBe("applicationEnvironmentConnect.stepTwo.validationPostLogoutUrl");

		fireEvent.input(
			screen.getByLabelText(
				"applicationEnvironmentConnect.stepTwo.redirectUrl"
			),
			{
				target: { value: "https://example.com/callback" },
			}
		);
		fireEvent.input(
			screen.getByLabelText(
				"applicationEnvironmentConnect.stepTwo.postLogoutUrl"
			),
			{ target: { value: "https://example.com/logout" } }
		);
		fireEvent.click(screen.getByRole("radio", { name: "common.yes" }));
		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.continue",
			})
		);
		await waitFor(() => {
			expect(
				screen
					.getByRole("link", {
						name: "applicationEnvironmentConnect.stepTwo.validationLogoutMethod",
					})
					.getAttribute("href")
			).toBe("#logout-method-control");
		});
		expect(
			screen
				.getByRole("link", {
					name: "applicationEnvironmentConnect.stepTwo.validationSignOutRequestUrl",
				})
				.getAttribute("href")
		).toBe("#sign-out-request-url-control");
		expect(
			document
				.getElementById("logout-method-control")
				?.getAttribute("data-error")
		).toBe("applicationEnvironmentConnect.stepTwo.validationLogoutMethod");
		expect(
			document
				.getElementById("sign-out-request-url-control")
				?.getAttribute("data-error")
		).toBe("applicationEnvironmentConnect.stepTwo.validationSignOutRequestUrl");
	});

	it("advances past Step 2 when endpoint validation succeeds", async () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: applicationSummary,
			error: null,
			isLoading: false,
		});

		render(<ConnectEnvironmentPage />);
		await enterStepTwo();
		fireEvent.input(
			screen.getByLabelText(
				"applicationEnvironmentConnect.stepTwo.redirectUrl"
			),
			{
				target: { value: "https://example.com/callback" },
			}
		);
		fireEvent.input(
			screen.getByLabelText(
				"applicationEnvironmentConnect.stepTwo.postLogoutUrl"
			),
			{ target: { value: "https://example.com/logout" } }
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.continue",
			})
		);

		await waitFor(() => {
			expect(
				screen.getByRole("group", {
					name: "applicationEnvironmentConnect.stepThree.clientType",
				})
			).toBeTruthy();
		});
		expect(screen.queryByTestId("error-summary")).toBeNull();
	});

	it("defaults PKCE to Yes when Public is selected", async () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: applicationSummary,
			error: null,
			isLoading: false,
		});

		render(<ConnectEnvironmentPage />);
		await enterStepThree();

		fireEvent.click(
			within(
				screen.getByRole("group", {
					name: "applicationEnvironmentConnect.stepThree.clientType",
				})
			).getByRole("radio", {
				name: "applicationEnvironmentConnect.publicClient",
			})
		);

		expect(
			within(
				screen.getByRole("group", {
					name: "applicationEnvironmentConnect.stepThree.pkceSupported",
				})
			).getByRole("radio", { name: "common.yes" })
		).toHaveProperty("checked", true);
	});

	it("blocks a Public client from continuing with PKCE set to No", async () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: applicationSummary,
			error: null,
			isLoading: false,
		});

		render(<ConnectEnvironmentPage />);
		await enterStepThree();
		fireEvent.click(
			within(
				screen.getByRole("group", {
					name: "applicationEnvironmentConnect.stepThree.clientType",
				})
			).getByRole("radio", {
				name: "applicationEnvironmentConnect.publicClient",
			})
		);
		fireEvent.click(
			within(
				screen.getByRole("group", {
					name: "applicationEnvironmentConnect.stepThree.pkceSupported",
				})
			).getByRole("radio", { name: "common.no" })
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.continue",
			})
		);

		await waitFor(() => {
			expect(screen.getByTestId("error-summary")).toBeTruthy();
		});
		expect(
			screen
				.getByRole("link", {
					name: "applicationEnvironmentConnect.stepThree.validationPkceSupported",
				})
				.getAttribute("href")
		).toBe("#pkce-supported-control");
		expect(
			screen.queryByRole("group", {
				name: "applicationEnvironmentConnect.stepFour.verificationMessages",
			})
		).toBeNull();
	});

	it("shows authentication methods only for confidential clients", async () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: applicationSummary,
			error: null,
			isLoading: false,
		});

		render(<ConnectEnvironmentPage />);
		await enterStepThree();
		expect(
			screen.getByRole("group", {
				name: "applicationEnvironmentConnect.stepThree.clientAuthMethod",
			})
		).toBeTruthy();

		const clientTypeGroup = screen.getByRole("group", {
			name: "applicationEnvironmentConnect.stepThree.clientType",
		});
		fireEvent.click(
			within(clientTypeGroup).getByRole("radio", {
				name: "applicationEnvironmentConnect.publicClient",
			})
		);
		expect(
			screen.queryByRole("group", {
				name: "applicationEnvironmentConnect.stepThree.clientAuthMethod",
			})
		).toBeNull();

		fireEvent.click(
			within(clientTypeGroup).getByRole("radio", {
				name: "applicationEnvironmentConnect.confidentialClient",
			})
		);
		expect(
			screen.getByRole("group", {
				name: "applicationEnvironmentConnect.stepThree.clientAuthMethod",
			})
		).toBeTruthy();
	});

	it("shows the sector identifier URL only when sharing is enabled", async () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: applicationSummary,
			error: null,
			isLoading: false,
		});

		render(<ConnectEnvironmentPage />);
		await enterStepThree();
		const sharesGroup = screen.getByRole("group", {
			name: "applicationEnvironmentConnect.stepThree.sharesIdentifier",
		});
		fireEvent.click(
			within(sharesGroup).getByRole("radio", { name: "common.yes" })
		);
		expect(
			screen.getByLabelText(
				"applicationEnvironmentConnect.stepThree.sectorIdentifierUrl"
			)
		).toBeTruthy();
		fireEvent.click(
			within(sharesGroup).getByRole("radio", { name: "common.no" })
		);
		expect(
			screen.queryByLabelText(
				"applicationEnvironmentConnect.stepThree.sectorIdentifierUrl"
			)
		).toBeNull();
	});

	it("preserves Step 3 values when returning to Step 2", async () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: applicationSummary,
			error: null,
			isLoading: false,
		});

		render(<ConnectEnvironmentPage />);
		await enterStepThree();
		fireEvent.click(
			within(
				screen.getByRole("group", {
					name: "applicationEnvironmentConnect.stepThree.clientType",
				})
			).getByRole("radio", {
				name: "applicationEnvironmentConnect.publicClient",
			})
		);
		const sharesGroup = screen.getByRole("group", {
			name: "applicationEnvironmentConnect.stepThree.sharesIdentifier",
		});
		fireEvent.click(
			within(sharesGroup).getByRole("radio", { name: "common.yes" })
		);
		fireEvent.input(
			screen.getByLabelText(
				"applicationEnvironmentConnect.stepThree.sectorIdentifierUrl"
			),
			{ target: { value: "https://example.com/sector.json" } }
		);
		fireEvent.click(screen.getByRole("button", { name: "common.back" }));
		await waitFor(() => {
			expect(
				screen.getByRole("heading", {
					name: "applicationEnvironmentConnect.stepTwo.title",
				})
			).toBeTruthy();
		});
		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.continue",
			})
		);
		await waitFor(() => {
			expect(
				(
					screen.getByLabelText(
						"applicationEnvironmentConnect.stepThree.sectorIdentifierUrl"
					) as HTMLInputElement
				).value
			).toBe("https://example.com/sector.json");
		});
		expect(
			within(
				screen.getByRole("group", {
					name: "applicationEnvironmentConnect.stepThree.clientType",
				})
			).getByRole("radio", {
				name: "applicationEnvironmentConnect.publicClient",
			})
		).toHaveProperty("checked", true);
	});

	it("continues to Step 4 after Step 3 validation succeeds", async () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: applicationSummary,
			error: null,
			isLoading: false,
		});

		render(<ConnectEnvironmentPage />);
		await enterStepThree();
		fireEvent.click(
			within(
				screen.getByRole("group", {
					name: "applicationEnvironmentConnect.stepThree.clientAuthMethod",
				})
			).getByRole("radio", {
				name: "applicationEnvironmentConnect.clientSecretBasic",
			})
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.continue",
			})
		);
		await waitFor(() => {
			expect(screen.getAllByRole("radio", { name: "common.no" })).toHaveLength(
				3
			);
		});
	});

	it("scrolls the form to the top when advancing a step", async () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: applicationSummary,
			error: null,
			isLoading: false,
		});

		render(<ConnectEnvironmentPage />);
		await enterStepTwo();
		mockedScrollIntoView.mockClear();
		fireEvent.input(
			screen.getByLabelText(
				"applicationEnvironmentConnect.stepTwo.redirectUrl"
			),
			{ target: { value: "https://example.com/callback" } }
		);
		fireEvent.input(
			screen.getByLabelText(
				"applicationEnvironmentConnect.stepTwo.postLogoutUrl"
			),
			{ target: { value: "https://example.com/logout" } }
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.continue",
			})
		);

		await waitFor(() => {
			expect(
				screen.getByRole("heading", {
					name: "applicationEnvironmentConnect.stepThree.title",
				})
			).toBeTruthy();
		});
		expect(mockedScrollIntoView).toHaveBeenCalledWith({
			behavior: "smooth",
			block: "start",
		});
	});

	it("renders the Security groups and preserves Step 3 values on Back", async () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: applicationSummary,
			error: null,
			isLoading: false,
		});

		render(<ConnectEnvironmentPage />);
		await enterStepThree();
		fireEvent.click(
			within(
				screen.getByRole("group", {
					name: "applicationEnvironmentConnect.stepThree.clientType",
				})
			).getByRole("radio", {
				name: "applicationEnvironmentConnect.publicClient",
			})
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.continue",
			})
		);

		await waitFor(() => {
			expect(
				screen.getByRole("heading", {
					name: "applicationEnvironmentConnect.stepFour.title",
				})
			).toBeTruthy();
		});
		expect(
			screen.getByRole("group", {
				name: "applicationEnvironmentConnect.stepFour.verificationTitle",
			})
		).toBeTruthy();
		expect(
			screen.getByRole("group", {
				name: "applicationEnvironmentConnect.stepFour.encryptionTitle",
			})
		).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "common.back" }));
		await waitFor(() => {
			expect(
				within(
					screen.getByRole("group", {
						name: "applicationEnvironmentConnect.stepThree.clientType",
					})
				).getByRole("radio", {
					name: "applicationEnvironmentConnect.publicClient",
				})
			).toHaveProperty("checked", true);
		});
	});

	it("shows anchored validation errors for conditional Security choices", async () => {
		mockedUseApplicationEnvironments.mockReturnValue({
			data: applicationSummary,
			error: null,
			isLoading: false,
		});

		render(<ConnectEnvironmentPage />);
		await enterStepThree();
		fireEvent.click(
			within(
				screen.getByRole("group", {
					name: "applicationEnvironmentConnect.stepThree.clientAuthMethod",
				})
			).getByRole("radio", {
				name: "applicationEnvironmentConnect.clientSecretBasic",
			})
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.continue",
			})
		);
		await waitFor(() => {
			expect(
				screen.getByRole("heading", {
					name: "applicationEnvironmentConnect.stepFour.title",
				})
			).toBeTruthy();
		});
		fireEvent.click(
			within(
				screen.getByRole("group", {
					name: "applicationEnvironmentConnect.stepFour.canEncryptRequests",
				})
			).getByRole("radio", { name: "common.yes" })
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.submit",
			})
		);

		await waitFor(() => {
			expect(
				screen
					.getByRole("link", {
						name: "applicationEnvironmentConnect.stepFour.validationEncryptionKeyAlgorithms",
					})
					.getAttribute("href")
			).toBe("#encryption-key-algorithms-control");
		});
		expect(
			screen
				.getByRole("group", {
					name: "applicationEnvironmentConnect.stepFour.encryptionKeyAlgorithms",
				})
				.getAttribute("id")
		).toBe("encryption-key-algorithms-control");
	});

	it("submits the completed environment from the final Security step", async () => {
		mockedCreateEnvironment.mockResolvedValue({ uuid: "environment-uuid-1" });
		mockedUseApplicationEnvironments.mockReturnValue({
			data: applicationSummary,
			error: null,
			isLoading: false,
		});

		render(<ConnectEnvironmentPage />);
		await enterStepThree();
		fireEvent.click(
			within(
				screen.getByRole("group", {
					name: "applicationEnvironmentConnect.stepThree.clientAuthMethod",
				})
			).getByRole("radio", {
				name: "applicationEnvironmentConnect.clientSecretBasic",
			})
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.continue",
			})
		);
		await waitFor(() => {
			expect(
				screen.getByRole("heading", {
					name: "applicationEnvironmentConnect.stepFour.title",
				})
			).toBeTruthy();
		});
		fireEvent.click(
			screen.getByRole("button", {
				name: "applicationEnvironmentConnect.submit",
			})
		);

		await waitFor(() => {
			expect(mockedCreateEnvironment).toHaveBeenCalledOnce();
			expect(mockedNavigate).toHaveBeenCalledWith({
				to: "/applications/$applicationUuid/environments",
				params: { applicationUuid: "application-uuid-1" },
			});
		});
	});
});
