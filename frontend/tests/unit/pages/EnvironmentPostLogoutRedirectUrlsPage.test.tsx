import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvironmentPostLogoutRedirectUrlsPage } from "@/features/application-environments/pages/EnvironmentPostLogoutRedirectUrlsPage";

const {
	mockedNavigate,
	mockedUpdateEnvironmentPostLogoutRedirectUris,
	mockedUseApplicationEnvironment,
	mockedUseApplicationEnvironments,
} = vi.hoisted(() => ({
	mockedNavigate: vi.fn(),
	mockedUpdateEnvironmentPostLogoutRedirectUris: vi.fn(),
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
				"applicationEnvironmentConnect.stepTwo.addPostLogoutRedirectUri":
					"Add post logout URL",
				"applicationEnvironmentConnect.stepTwo.postLogoutUrl": `Post logout URL ${options?.count ?? 1}`,
				"applicationEnvironmentConnect.stepTwo.postLogoutUrlsHint":
					"Where CanadaLogin can send users after they sign out.",
				"applicationEnvironmentConnect.stepTwo.postLogoutUrlsTitle":
					"Post logout URLs",
				"applicationEnvironmentConnect.stepTwo.validationPostLogoutUrl":
					"Enter a valid post-logout URL.",
				"applicationEnvironmentManagement.cancel": "Cancel",
				"applicationEnvironmentManagement.changePostLogoutRedirectUrls":
					"Change post logout redirect URLs",
				"applicationEnvironmentManagement.errorBody":
					"The environment could not be loaded.",
				"applicationEnvironmentManagement.errorTitle":
					"Unable to load environment",
				"applicationEnvironmentManagement.loadingBody":
					"Loading the environment configuration.",
				"applicationEnvironmentManagement.loadingTitle": "Loading environment",
				"applicationEnvironmentManagement.postLogoutRedirectUrlsIntro":
					"CanadaLogin uses post logout redirect URLs to return users to your application after sign-out.",
				"applicationEnvironmentManagement.postLogoutRedirectUrlsRequirementsLink":
					"Learn more about post logout redirect URL requirements.",
				"applicationEnvironmentManagement.saveChanges": "Save changes",
				"applicationEnvironments.switchApplication": "Switch application",
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
			isUpdatingPostLogoutRedirectUris: false,
			postLogoutRedirectUrisUpdateError: null,
			updateEnvironmentPostLogoutRedirectUris:
				mockedUpdateEnvironmentPostLogoutRedirectUris,
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
			<button disabled={disabled} type={type} onClick={() => onGcdsClick?.()}>
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
			<a href={href} onClick={(event) => onGcdsClick?.(event)}>
				{children}
			</a>
		),
		Notice: passthrough,
		Text: passthrough,
	};
});

describe("EnvironmentPostLogoutRedirectUrlsPage", () => {
	const environment = {
		config: {
			postLogoutRedirectUris: [
				"https://example.com/logout",
				"https://example.com/alternate-logout",
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
		mockedUpdateEnvironmentPostLogoutRedirectUris.mockResolvedValue(
			environment
		);
	});

	it("hydrates, adds, removes, and submits post-logout URLs", async () => {
		render(<EnvironmentPostLogoutRedirectUrlsPage />);

		expect(
			screen.getByRole("heading", {
				name: "Change post logout redirect URLs",
			})
		).toBeTruthy();
		expect(
			screen.getByText(
				"CanadaLogin uses post logout redirect URLs to return users to your application after sign-out."
			)
		).toBeTruthy();
		expect(
			screen.getByText(
				"Learn more about post logout redirect URL requirements."
			)
		).toBeTruthy();
		expect(screen.getAllByRole("textbox")).toHaveLength(2);

		fireEvent.click(
			screen.getByRole("button", { name: "Add post logout URL" })
		);
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
			throw new Error("Expected two post-logout URL inputs");
		}
		fireEvent.input(firstInput, {
			target: { value: "https://new.example.com/logout" },
		});
		fireEvent.input(secondInput, {
			target: { value: "https://new.example.com/alternate-logout" },
		});
		fireEvent.submit(firstInput.closest("form") as HTMLFormElement);

		await waitFor(() => {
			expect(
				mockedUpdateEnvironmentPostLogoutRedirectUris
			).toHaveBeenCalledWith({
				environmentUuid: "environment-uuid-1",
				postLogoutRedirectUris: [
					"https://new.example.com/logout",
					"https://new.example.com/alternate-logout",
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

	it("requires every post-logout URL to be valid before submitting", async () => {
		render(<EnvironmentPostLogoutRedirectUrlsPage />);

		const input = screen.getAllByRole("textbox")[0];
		if (!input) {
			throw new Error("Expected a post-logout URL input");
		}
		const form = input.closest("form");
		if (!form) {
			throw new Error("Expected the post-logout URL form");
		}
		expect(form.getAttribute("novalidate")).not.toBeNull();
		fireEvent.input(input, { target: { value: "not-a-url" } });
		fireEvent.submit(form);

		await waitFor(() => {
			expect(screen.getByTestId("error-summary")).toBeTruthy();
		});
		expect(input.closest("label")?.getAttribute("data-error")).toBe(
			"Enter a valid post-logout URL."
		);
		expect(
			mockedUpdateEnvironmentPostLogoutRedirectUris
		).not.toHaveBeenCalled();
	});
});
