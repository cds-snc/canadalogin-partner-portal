import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	EnvironmentUrlPage,
	type EnvironmentUrlLanguage,
} from "@/features/application-environments/pages/EnvironmentUrlPage";

const {
	mockedNavigate,
	mockedUpdateEnvironmentUrl,
	mockedUseApplicationEnvironment,
	mockedUseApplicationEnvironments,
} = vi.hoisted(() => ({
	mockedNavigate: vi.fn(),
	mockedUpdateEnvironmentUrl: vi.fn(),
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
	GcdsHint: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
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
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"applicationEnvironmentConnect.applicationNameFallback":
					"this application",
				"applicationEnvironmentConnect.stepOne.applicationUrlEn":
					"English environment URL",
				"applicationEnvironmentConnect.stepOne.applicationUrlFr":
					"French environment URL",
				"applicationEnvironmentConnect.stepOne.applicationUrlFrHint":
					"If both language versions use the same URL, enter it again.",
				"applicationEnvironments.connect.validationEnglishUrl":
					"Enter an English environment URL.",
				"applicationEnvironments.connect.validationFrenchUrl":
					"Enter a French environment URL.",
				"applicationEnvironmentManagement.cancel": "Cancel",
				"applicationEnvironmentManagement.changeEnglishUrl":
					"Change English environment URL",
				"applicationEnvironmentManagement.changeFrenchUrl":
					"Change French environment URL",
				"applicationEnvironmentManagement.errorBody":
					"The environment could not be loaded.",
				"applicationEnvironmentManagement.errorTitle":
					"Unable to load environment",
				"applicationEnvironmentManagement.loadingBody":
					"Loading the environment configuration.",
				"applicationEnvironmentManagement.loadingTitle": "Loading environment",
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
			isUpdatingUrl: false,
			updateEnvironmentUrl: mockedUpdateEnvironmentUrl,
			urlUpdateError: null,
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

describe("EnvironmentUrlPage", () => {
	const environment = {
		config: {
			applicationUrlEn: "https://example.com/en",
			applicationUrlFr: "https://example.com/fr",
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
		mockedUpdateEnvironmentUrl.mockResolvedValue(environment);
	});

	it.each([
		[
			"en",
			"Change English environment URL",
			"https://example.com/en",
			"applicationUrlEn",
		],
		[
			"fr",
			"Change French environment URL",
			"https://example.com/fr",
			"applicationUrlFr",
		],
	] as const)(
		"hydrates the %s URL editor and submits its field",
		async (
			language: EnvironmentUrlLanguage,
			title: string,
			currentUrl: string,
			field: "applicationUrlEn" | "applicationUrlFr"
		) => {
			render(<EnvironmentUrlPage language={language} />);

			expect(screen.getByRole("heading", { name: title })).toBeTruthy();
			const input = screen.getByRole("textbox");
			expect((input as HTMLInputElement).value).toBe(currentUrl);

			fireEvent.input(input, { target: { value: "https://new.example.com" } });
			fireEvent.submit(input.closest("form") as HTMLFormElement);

			await waitFor(() => {
				expect(mockedUpdateEnvironmentUrl).toHaveBeenCalledWith({
					environmentUuid: "environment-uuid-1",
					[field]: "https://new.example.com",
				});
			});
			expect(mockedNavigate).toHaveBeenCalledWith({
				params: {
					applicationUuid: "application-uuid-1",
					environmentUuid: "environment-uuid-1",
				},
				to: "/applications/$applicationUuid/environments/$environmentUuid",
			});
		}
	);

	it("uses connect URL validation before submitting", async () => {
		render(<EnvironmentUrlPage language="en" />);

		const input = screen.getByRole("textbox");
		const form = input.closest("form");
		if (!form) {
			throw new Error("Expected the environment URL form");
		}
		expect(form.getAttribute("novalidate")).not.toBeNull();
		fireEvent.input(input, { target: { value: "not-a-url" } });
		fireEvent.submit(form);

		await waitFor(() => {
			expect(screen.getByTestId("error-summary")).toBeTruthy();
		});
		expect(input.closest("label")?.getAttribute("data-error")).toBe(
			"Enter an English environment URL."
		);
		expect(mockedUpdateEnvironmentUrl).not.toHaveBeenCalled();
	});
});
