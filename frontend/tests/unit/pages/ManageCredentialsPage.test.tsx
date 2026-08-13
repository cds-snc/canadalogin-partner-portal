import {
	createElement,
	type PropsWithChildren,
	type ReactElement,
} from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ManageCredentialsPage } from "@/features/your-applications/pages/ManageCredentialsPage";
import { HttpRequestError } from "@/fetch/errors";
import {
	getAccessibleRPApplicationClientCredentials,
	getAccessibleRPApplicationRotatedClientSecrets,
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
		href,
	}: PropsWithChildren<{ href?: string }>): ReactElement =>
		href ? (
			<a href={href}>{children}</a>
		) : (
			<button type="button">{children}</button>
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
	getApplicationRPConfiguration: vi.fn(),
	rotateAccessibleRPApplicationClientSecret: vi.fn(),
}));

describe("ManageCredentialsPage", () => {
	beforeEach(() => {
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
});
