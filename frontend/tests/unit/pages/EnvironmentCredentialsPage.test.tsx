import {
	createElement,
	type PropsWithChildren,
	type ReactElement,
	type ReactNode,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EnvironmentCredentialsPage } from "@/features/application-environments/pages/EnvironmentCredentialsPage";

const {
	mockedDeleteApplicationEnvironmentRotatedClientSecret,
	mockedGetApplicationEnvironmentClientCredentials,
	mockedGetApplicationEnvironmentRotatedClientSecrets,
	mockedRotateApplicationEnvironmentClientSecret,
	mockedClipboardWriteText,
	mockedToastSuccess,
	mockedUseApplicationEnvironment,
} = vi.hoisted(() => ({
	mockedDeleteApplicationEnvironmentRotatedClientSecret: vi.fn(),
	mockedGetApplicationEnvironmentClientCredentials: vi.fn(),
	mockedGetApplicationEnvironmentRotatedClientSecrets: vi.fn(),
	mockedRotateApplicationEnvironmentClientSecret: vi.fn(),
	mockedClipboardWriteText: vi.fn(),
	mockedToastSuccess: vi.fn(),
	mockedUseApplicationEnvironment: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
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
				"applicationEnvironmentManagement.configurationTab": "Configuration",
				"applicationEnvironmentManagement.copyAction": "Copy",
				"applicationEnvironmentManagement.copySecretAction": "Copy secret",
				"applicationEnvironmentManagement.credentialsComingSoonBody":
					"Credentials are coming soon.",
				"applicationEnvironmentManagement.credentialsComingSoonTitle":
					"Credentials coming soon",
				"applicationEnvironmentManagement.credentialsTab": "Credentials",
				"applicationEnvironmentManagement.credentialsTitle":
					"Environment credentials",
				"applicationEnvironmentManagement.clientIdCopiedSuccess":
					"Client ID copied",
				"applicationEnvironmentManagement.clientSecretCopiedSuccess":
					"Secret copied",
				"applicationEnvironmentManagement.expireConfirmTitle":
					"Expire secret now?",
				"applicationEnvironmentManagement.expireNowAction": "Expire now",
				"applicationEnvironmentManagement.expireSecretAction": "Expire secret",
				"applicationEnvironmentManagement.expireSuccessBody":
					"The secret is no longer active.",
				"applicationEnvironmentManagement.expireSuccessTitle":
					"Secret expired successfully",
				"applicationEnvironmentManagement.revealAction": "Reveal",
				"applicationEnvironmentManagement.rotateConfirmTitle": "Rotate secret?",
				"applicationEnvironmentManagement.rotateSecretAction": "Rotate",
				"applicationEnvironmentManagement.rotateSuccessTitle":
					"Secret rotated successfully",
				"applicationEnvironmentManagement.rotationReasonLabel":
					"Reason for rotation",
				"applicationEnvironmentManagement.tabsLabel": "Environment views",
			};
			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@/fetch", () => ({
	getRequestErrorNotice: () => null,
}));

vi.mock("@/components/ui/Toast", () => ({
	useToast: () => ({ success: mockedToastSuccess }),
}));

vi.mock("@/fetch/application-environment-client-secrets", () => ({
	deleteApplicationEnvironmentRotatedClientSecret:
		mockedDeleteApplicationEnvironmentRotatedClientSecret,
	getApplicationEnvironmentClientCredentials:
		mockedGetApplicationEnvironmentClientCredentials,
	getApplicationEnvironmentRotatedClientSecrets:
		mockedGetApplicationEnvironmentRotatedClientSecrets,
	rotateApplicationEnvironmentClientSecret:
		mockedRotateApplicationEnvironmentClientSecret,
}));

vi.mock(
	"@/features/application-environments/hooks/use-application-environment",
	() => ({ useApplicationEnvironment: mockedUseApplicationEnvironment })
);

vi.mock("@/components/ui", () => ({
	Alert: ({
		alertRole,
		children,
		container,
		heading,
		onDismiss,
	}: PropsWithChildren<{
		alertRole: "danger" | "info" | "success" | "warning";
		container?: "full" | "xl" | "lg" | "md" | "sm" | "xs";
		heading: string;
		onDismiss?: () => void;
	}>): ReactElement => (
		<section data-alert-container={container} data-alert-role={alertRole}>
			<h3>{heading}</h3>
			{children}
			<button type="button" onClick={onDismiss}>
				Dismiss
			</button>
		</section>
	),
	Button: ({
		children,
		disabled,
		onGcdsClick,
		type = "button",
	}: PropsWithChildren<{
		disabled?: boolean;
		onGcdsClick?: (event: Event) => void;
		type?: "button" | "submit";
	}>): ReactElement => (
		<button
			disabled={disabled}
			type={type}
			onClick={() => onGcdsClick?.(new Event("click"))}
		>
			{children}
		</button>
	),
	Grid: ({ children, tag = "div" }: PropsWithChildren<{ tag?: string }>): ReactElement =>
		createElement(tag, { "data-grid-tag": tag }, children),
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag: "h1" | "h2" | "h3" }>): ReactElement => {
		const HeadingTag = tag;
		return <HeadingTag>{children}</HeadingTag>;
	},
	Input: ({
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
		value?: string;
	}): ReactElement => (
		<label>
			{label}
			<input
				id={inputId}
				name={name}
				value={value}
				onInput={(event) => onInput?.(event)}
			/>
		</label>
	),
	Link: ({
		children,
		href,
	}: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Modal: ({
		children,
		description,
		footer,
		isOpen,
		title,
	}: PropsWithChildren<{
		description?: string;
		footer?: ReactNode;
		isOpen: boolean;
		title: string;
	}>): ReactElement | null =>
		isOpen ? (
			<div aria-label={title} role="dialog">
				<h2>{title}</h2>
				{description ? <p>{description}</p> : null}
				{children}
				{footer}
			</div>
		) : null,
	Notice: ({
		children,
		noticeRole,
		noticeTitle,
	}: PropsWithChildren<{
		noticeRole: "danger" | "info" | "success" | "warning";
		noticeTitle: string;
	}>): ReactElement => (
		<section data-notice-role={noticeRole}>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Tabs: ({
		ariaLabel,
		items,
	}: {
		ariaLabel: string;
		items: ReadonlyArray<{
			active?: boolean;
			href: string;
			label: ReactNode;
		}>;
	}): ReactElement => (
		<nav aria-label={ariaLabel}>
			{items.map((item) => (
				<a
					aria-current={item.active ? "page" : undefined}
					href={item.href}
					key={item.href}
				>
					{item.label}
				</a>
			))}
		</nav>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

const renderPage = (): void => {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	render(
		<QueryClientProvider client={queryClient}>
			<EnvironmentCredentialsPage />
		</QueryClientProvider>
	);
};

const eligibleEnvironment = {
	clientId: "environment-client-id",
	config: { clientAuthMethod: "client_secret_basic" },
	partnerLabel: "Test environment",
	tenantCode: "test",
};

describe("EnvironmentCredentialsPage", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("navigator", {
			clipboard: { writeText: mockedClipboardWriteText },
		});
		mockedClipboardWriteText.mockResolvedValue(undefined);
		mockedGetApplicationEnvironmentClientCredentials.mockResolvedValue({
			clientId: "environment-client-id",
			clientSecret: "environment-client-secret",
			clientSecretId: "secret-id",
		});
		mockedGetApplicationEnvironmentRotatedClientSecrets.mockResolvedValue([]);
		mockedDeleteApplicationEnvironmentRotatedClientSecret.mockResolvedValue({
			message: "Rotated client secret deleted",
		});
		mockedRotateApplicationEnvironmentClientSecret.mockResolvedValue({
			clientId: "environment-client-id",
			clientSecret: "replacement-secret",
			clientSecretId: "replacement-secret-id",
		});
	});

	it("renders shared tabs with Credentials active", () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: { partnerLabel: "Test environment" },
			error: null,
			isLoading: false,
		});

		renderPage();

		expect(
			screen.getByRole("navigation", { name: "Environment views" })
		).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: "Credentials" })
				.getAttribute("aria-current")
		).toBe("page");
		expect(
			screen.getByRole("link", { name: "Configuration" }).getAttribute("href")
		).toBe("/applications/application-uuid-1/environments/environment-uuid-1");
	});

	it("loads rotated secrets but not the active secret on page entry", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: {
				...eligibleEnvironment,
				config: { clientAuthMethod: "none" },
			},
			error: null,
			isLoading: false,
		});

		renderPage();

		expect(await screen.findByText("environment-client-id")).toBeTruthy();
		await waitFor(() => {
			expect(
				mockedGetApplicationEnvironmentRotatedClientSecrets
			).toHaveBeenCalledWith("application-uuid-1", "environment-uuid-1");
		});
		expect(
			mockedGetApplicationEnvironmentClientCredentials
		).not.toHaveBeenCalled();
	});

	it.each([
		{
			config: { clientAuthMethod: "client_secret_basic" },
			tenantCode: "production",
		},
		{
			config: { clientAuthMethod: "private_key_jwt" },
			tenantCode: "test",
		},
	])("does not load credentials for an unsupported environment", async (environment) => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: { ...eligibleEnvironment, ...environment },
			error: null,
			isLoading: false,
		});

		renderPage();

		expect(
			await screen.findByText("Credentials are coming soon.")
		).toBeTruthy();
		expect(
			mockedGetApplicationEnvironmentRotatedClientSecrets
		).not.toHaveBeenCalled();
		expect(
			mockedGetApplicationEnvironmentClientCredentials
		).not.toHaveBeenCalled();
	});

	it("loads the active secret only after the user selects Reveal", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: eligibleEnvironment,
			error: null,
			isLoading: false,
		});

		renderPage();

		fireEvent.click(await screen.findByRole("button", { name: "Reveal" }));

		expect(await screen.findByText("environment-client-secret")).toBeTruthy();
		expect(
			mockedGetApplicationEnvironmentClientCredentials
		).toHaveBeenCalledWith("application-uuid-1", "environment-uuid-1");
		expect(mockedToastSuccess).not.toHaveBeenCalled();
	});

	it("shows grey backgrounds for the three displayed credential values", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: eligibleEnvironment,
			error: null,
			isLoading: false,
		});

		renderPage();

		const authMethod = await screen.findByText("client_secret_basic");
		const clientId = screen.getByText("environment-client-id");
		const maskedSecret = screen.getByText("****************");
		expect(authMethod.closest(".environment-credentials__value")).toBeTruthy();
		expect(clientId.closest(".environment-credentials__value")).toBeTruthy();
		expect(maskedSecret.closest(".environment-credentials__value")).toBeTruthy();
	});

	it("shows a success toast after copying the client ID", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: eligibleEnvironment,
			error: null,
			isLoading: false,
		});

		renderPage();
		fireEvent.click(await screen.findByRole("button", { name: "Copy" }));

		await waitFor(() => {
			expect(mockedClipboardWriteText).toHaveBeenCalledWith(
				"environment-client-id"
			);
			expect(mockedToastSuccess).toHaveBeenCalledWith("Client ID copied");
		});
	});

	it("shows a success toast after copying the client secret", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: eligibleEnvironment,
			error: null,
			isLoading: false,
		});

		renderPage();
		fireEvent.click(
			await screen.findByRole("button", { name: "Copy secret" })
		);

		await waitFor(() => {
			expect(mockedClipboardWriteText).toHaveBeenCalledWith(
				"environment-client-secret"
			);
			expect(mockedToastSuccess).toHaveBeenCalledWith("Secret copied");
		});
	});

	it("rotates with the required reason and a seven-day expiry", async () => {
		const now = 1_800_000_000_000;
		vi.spyOn(Date, "now").mockReturnValue(now);
		mockedUseApplicationEnvironment.mockReturnValue({
			data: eligibleEnvironment,
			error: null,
			isLoading: false,
		});

		renderPage();
		const reasonInput = screen.getByLabelText("Reason for rotation");
		fireEvent.input(reasonInput, { target: { value: "annual rotation" } });
		fireEvent.submit(reasonInput.closest("form") as HTMLFormElement);

		expect(
			await screen.findByRole("dialog", { name: "Rotate secret?" })
		).toBeTruthy();
		fireEvent.click(screen.getAllByRole("button", { name: "Rotate" })[1]!);

		await waitFor(() => {
			expect(
				mockedRotateApplicationEnvironmentClientSecret
			).toHaveBeenCalledWith("application-uuid-1", "environment-uuid-1", {
				description: "annual rotation",
				rotatedSecretExpiredAt: now / 1000 + 7 * 24 * 60 * 60,
			});
		});
		expect(await screen.findByText("Secret rotated successfully")).toBeTruthy();
		expect(
			screen
				.getByText("Secret rotated successfully")
				.closest("section")
				?.getAttribute("data-alert-role")
		).toBe("success");
		expect(
			screen
				.getByText("Secret rotated successfully")
				.closest("section")
				?.getAttribute("data-alert-container")
		).toBe("xs");
		const rotationSection = screen
			.getByRole("heading", {
				name: "applicationEnvironmentManagement.rotateSecretTitle",
			})
			.closest('[data-grid-tag="section"]');
		expect(
			rotationSection?.contains(
				screen
					.getByText("Secret rotated successfully")
					.closest("[data-alert-role]")
			)
		).toBe(true);
		expect(
			mockedGetApplicationEnvironmentClientCredentials
		).not.toHaveBeenCalled();
	});

	it("expires only the selected rotated secret after confirmation", async () => {
		mockedUseApplicationEnvironment.mockReturnValue({
			data: eligibleEnvironment,
			error: null,
			isLoading: false,
		});
		mockedGetApplicationEnvironmentRotatedClientSecrets.mockResolvedValue([
			{
				description: "incident #21213",
				expiredAt: 1_800_000_000,
				rotatedAt: 1_799_000_000,
				secretId: "rotated-secret-id",
				value: "rotated-secret-value",
			},
		]);

		renderPage();
		const secretRow = await screen.findByRole("listitem");
		const secretDetails = secretRow.querySelector(
			".environment-credentials__secret-details"
		);
		expect(secretRow.querySelector("strong")?.textContent).toBe(
			"incident #21213"
		);
		expect(secretDetails?.querySelector("button")?.textContent).toBe("Expire now");
		fireEvent.click(await screen.findByRole("button", { name: "Expire now" }));
		expect(
			await screen.findByRole("dialog", { name: "Expire secret now?" })
		).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Expire secret" }));

		await waitFor(() => {
			expect(
				mockedDeleteApplicationEnvironmentRotatedClientSecret
			).toHaveBeenCalledWith(
				"application-uuid-1",
				"environment-uuid-1",
				"rotated-secret-value"
			);
		});
		expect(await screen.findByText("Secret expired successfully")).toBeTruthy();
		expect(
			screen
				.getByText("Secret expired successfully")
				.closest("section")
				?.getAttribute("data-alert-container")
		).toBe("xs");
		const expiringSecretsSection = screen
			.getByRole("heading", {
				name: "applicationEnvironmentManagement.expiringSecretsTitle",
			})
			.closest('[data-grid-tag="section"]');
		expect(
			expiringSecretsSection?.contains(
				screen
					.getByText("Secret expired successfully")
					.closest("[data-alert-role]")
			)
		).toBe(true);
		expect(
			mockedGetApplicationEnvironmentClientCredentials
		).not.toHaveBeenCalled();
	});
});
