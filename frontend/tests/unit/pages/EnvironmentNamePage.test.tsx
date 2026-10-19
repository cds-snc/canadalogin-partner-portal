import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnvironmentNamePage } from "@/features/application-environments/pages/EnvironmentNamePage";

const {
	mockedNavigate,
	mockedUpdateEnvironmentName,
	mockedUseApplicationEnvironment,
	mockedUseApplicationEnvironments,
} = vi.hoisted(() => ({
	mockedNavigate: vi.fn(),
	mockedUpdateEnvironmentName: vi.fn(),
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
				"applicationEnvironmentConnect.stepOne.environmentName":
					"Environment name",
				"applicationEnvironmentConnect.stepOne.environmentNameHint":
					"Use letters, numbers and hyphens only.",
				"applicationEnvironments.connect.validationEnvironmentName":
					"Enter an environment name.",
				"applicationEnvironmentManagement.cancel": "Cancel",
				"applicationEnvironmentManagement.changeEnvironmentName":
					"Change environment name",
				"applicationEnvironmentManagement.saveChanges": "Save changes",
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
			isUpdatingName: false,
			updateEnvironmentName: mockedUpdateEnvironmentName,
			updateError: null,
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
				{Object.values(errorLinks ?? {}).map((label) => (
					<span key={label}>{label}</span>
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
		Text: passthrough,
	};
});

describe("EnvironmentNamePage", () => {
	const environment = {
		config: { environmentName: "TEST-portal" },
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
		mockedUpdateEnvironmentName.mockResolvedValue(environment);
	});

	it("hydrates and submits the unprefixed environment name", async () => {
		render(<EnvironmentNamePage />);

		const input = await screen.findByRole("textbox");
		expect((input as HTMLInputElement).value).toBe("portal");

		fireEvent.input(input, { target: { value: "portal-renamed" } });
		fireEvent.submit(input.closest("form") as HTMLFormElement);

		await waitFor(() => {
			expect(mockedUpdateEnvironmentName).toHaveBeenCalledWith({
				environmentName: "portal-renamed",
				environmentUuid: "environment-uuid-1",
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

	it("rejects names that use connect-environment validation rules", async () => {
		render(<EnvironmentNamePage />);

		const input = await screen.findByRole("textbox");
		expect(input.closest("form")?.noValidate).toBe(true);
		fireEvent.input(input, { target: { value: "invalid name" } });
		fireEvent.submit(input.closest("form") as HTMLFormElement);

		await waitFor(() => {
			expect(screen.getByTestId("error-summary")).toBeTruthy();
		});
		expect(input.closest("label")?.getAttribute("data-error")).toBe(
			"Enter an environment name."
		);
		expect(mockedUpdateEnvironmentName).not.toHaveBeenCalled();
	});
});