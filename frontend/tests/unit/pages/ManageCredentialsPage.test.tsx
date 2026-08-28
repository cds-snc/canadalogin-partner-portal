import {
	createElement,
	type PropsWithChildren,
	type ReactElement,
} from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ManageCredentialsPage } from "@/features/your-applications/pages/ManageCredentialsPage";
import { HttpRequestError } from "@/fetch/errors";
import {
	getAccessibleRPApplicationClientCredentials,
	getAccessibleRPApplicationRotatedClientSecrets,
	getAccessibleRPApplicationSecretChangeLog,
	getApplicationRPConfiguration,
} from "@/fetch/rp-applications";

vi.mock("react-i18next", async (importOriginal) => ({
	...(await importOriginal<typeof import("react-i18next")>()),
	useTranslation: () => ({
		i18n: { resolvedLanguage: "en" },
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"manageCredentials.applicationClientBackAction":
					"Back to the RP application",
				"manageCredentials.applicationClientUnavailableBody":
					"The external identity service is temporarily unavailable.",
				"manageCredentials.applicationClientUnavailableTitle":
					"Credentials temporarily unavailable",
				"manageCredentials.applicationClientLoadingBody":
					"Loading credentials.",
				"manageCredentials.applicationClientLoadingTitle":
					"Loading credentials",
				"manageCredentials.clientCredentials": "Client credentials",
				"manageCredentials.secretChangeLogBody":
					"Download the secret-change log.",
				"manageCredentials.secretChangeLogDownloadAction":
					"Download secret-change log (CSV)",
				"manageCredentials.secretChangeLogDownloadSuccess":
					"Secret-change log downloaded",
				"manageCredentials.secretChangeLogTitle": "Secret-change log",
			};
			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useParams: () => ({
		applicationInformationUuid: "application-information-uuid-1",
		rpConfigurationUuid: "rp-application-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
}));

vi.mock("@/components/ui/Toast", () => ({
	useToast: () => ({ success: vi.fn() }),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		disabled,
		href,
		onGcdsClick,
	}: PropsWithChildren<{
		disabled?: boolean;
		href?: string;
		onGcdsClick?: () => void;
	}>): ReactElement =>
		href ? (
			<a href={href}>{children}</a>
		) : (
			<button disabled={disabled} type="button" onClick={onGcdsClick}>
				{children}
			</button>
		),
	Checkboxes: (): null => null,
	ConfirmDialog: (): null => null,
	Container: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
	),
	Grid: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
	Heading: ({
		children,
		tag = "h1",
	}: PropsWithChildren<{ tag?: string }>): ReactElement =>
		createElement(tag, undefined, children),
	Input: (): null => null,
	Notice: ({
		children,
		noticeTitle,
	}: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/fetch/rp-applications", () => ({
	createAccessibleRPApplicationRotatedClientSecret: vi.fn(),
	deleteAccessibleRPApplicationRotatedClientSecret: vi.fn(),
	getAccessibleRPApplicationClientCredentials: vi.fn(),
	getAccessibleRPApplicationRotatedClientSecrets: vi.fn(),
	getAccessibleRPApplicationSecretChangeLog: vi.fn(),
	getApplicationRPConfiguration: vi.fn(),
	rotateAccessibleRPApplicationClientSecret: vi.fn(),
}));

describe("ManageCredentialsPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getApplicationRPConfiguration).mockResolvedValue({
			configurationName: "Benefits Portal",
			serviceNameEn: "Benefits service",
			serviceNameFr: "Service de prestations",
		} as Awaited<ReturnType<typeof getApplicationRPConfiguration>>);
		const providerUnavailable = new HttpRequestError({ status: 503 });
		vi.mocked(getAccessibleRPApplicationClientCredentials).mockRejectedValue(
			providerUnavailable
		);
		vi.mocked(getAccessibleRPApplicationRotatedClientSecrets).mockRejectedValue(
			providerUnavailable
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("keeps the focused route and renders a scoped provider-outage notice", async () => {
		render(<ManageCredentialsPage />);

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { level: 1, name: "Benefits Portal" })
			).toBeTruthy();
		});
		expect(
			screen.getByRole("heading", {
				name: "Credentials temporarily unavailable",
			})
		).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: "Back to the RP application" })
				.getAttribute("href")
		).toBe(
			"/workspaces/workspace-uuid-1/applications/application-information-uuid-1/rp-configurations/rp-application-uuid-1"
		);
	});

	it("downloads the scoped secret-change CSV without exposing secret values", async () => {
		vi.mocked(getAccessibleRPApplicationClientCredentials).mockResolvedValue({
			clientId: "client-id-1",
			clientSecret: null,
			clientSecretId: null,
		});
		vi.mocked(getAccessibleRPApplicationRotatedClientSecrets).mockResolvedValue(
			[]
		);
		const csv = new Blob(
			[
				"TimeGenerated,Actor,Action,RPConfigurationId\n2026-08-25T12:00:00Z,user-1,ROTATE_SECRET,rp-application-uuid-1",
			],
			{ type: "text/csv" }
		);
		vi.mocked(getAccessibleRPApplicationSecretChangeLog).mockResolvedValue(csv);
		const createObjectURL = vi.fn(() => "blob:secret-change-log");
		const revokeObjectURL = vi.fn();
		vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
		const anchorClick = vi
			.spyOn(HTMLAnchorElement.prototype, "click")
			.mockImplementation(() => undefined);

		render(<ManageCredentialsPage />);

		const downloadButton = await screen.findByRole("button", {
			name: "Download secret-change log (CSV)",
		});
		fireEvent.click(downloadButton);

		await waitFor(() => {
			expect(getAccessibleRPApplicationSecretChangeLog).toHaveBeenCalledWith(
				"rp-application-uuid-1",
				"workspace-uuid-1",
				"application-information-uuid-1"
			);
		});
		expect(createObjectURL).toHaveBeenCalledWith(csv);
		expect(anchorClick).toHaveBeenCalledTimes(1);
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:secret-change-log");
	});
});
