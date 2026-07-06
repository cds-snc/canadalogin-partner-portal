import type { PropsWithChildren, ReactElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { OAuthSetupPage } from "@/features/your-applications/pages/OAuthSetupPage";
import { HttpRequestError } from "@/fetch/errors";
import { getCurrentUserRPOAuthSetup } from "@/fetch/rp-applications";

const replaceMock = vi.fn();
const originalLocation = globalThis.location;

vi.mock("@tanstack/react-router", () => ({
	useParams: (): { rpApplicationUuid: string } => ({
		rpApplicationUuid: "application-uuid-1",
	}),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): { i18n: { language: string }; t: (key: string) => string } => ({
		i18n: { language: "en" },
		t: (key: string): string => {
			const map: Record<string, string> = {
				"nav.home": "Home",
				"nav.dashboard": "Dashboard",
				"rpOAuthSetup.applicationSectionTitle": "Application details",
				"rpOAuthSetup.applicationUrlLabel": "Application URL",
				"rpOAuthSetup.departmentLabel": "Department",
				"rpOAuthSetup.loadingBody": "Loading OAuth setup details for this RP application.",
				"rpOAuthSetup.loadingTitle": "Loading OAuth setup",
				"rpOAuthSetup.logoutRedirectUrisLabel": "Logout redirect URIs",
				"rpOAuthSetup.logoutUriLabel": "Logout URI",
				"rpOAuthSetup.noLogoutRedirectUris":
					"No logout redirect URIs configured.",
				"rpOAuthSetup.noRedirectUris": "No redirect URIs configured.",
				"rpOAuthSetup.notAvailable": "Not available",
				"rpOAuthSetup.oauthSectionTitle": "OAuth setup",
				"rpOAuthSetup.pkceDisabled": "Disabled",
				"rpOAuthSetup.pkceEnabled": "Enabled",
				"rpOAuthSetup.pkceEnabledLabel": "PKCE",
				"rpOAuthSetup.redirectUrisLabel": "Redirect URIs",
				"rpOAuthSetup.statusLabel": "Status",
				"rpOAuthSetup.summary": "Review this RP application's read-only OAuth setup details.",
				"rpOAuthSetup.title": "RP OAuth setup",
				"rpOAuthSetup.usageReportAction": "Usage Report",
				"workspaces.clientCredentials": "Client credentials",
				"workspaces.manageCredentials": "Manage credentials",
				"nav.organization": "Organization",
			};

			return map[key] ?? key;
		},
	}),
}));

vi.mock("@/components/layout", () => ({
	Breadcrumbs: (): ReactElement => <nav>Breadcrumbs</nav>,
	CenteredPageLayout: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		onGcdsClick,
	}: PropsWithChildren<{ onGcdsClick?: () => void }>): ReactElement => (
		<button type="button" onClick={onGcdsClick}>
			{children}
		</button>
	),
	Card: ({ cardTitle, href }: { cardTitle?: string; href?: string }): ReactElement => (
		href ? <a href={href}>{cardTitle}</a> : <div>{cardTitle}</div>
	),
	Details: ({
		children,
		detailsTitle,
	}: PropsWithChildren<{ detailsTitle: string }>): ReactElement => (
		<section>
			<h2>{detailsTitle}</h2>
			{children}
		</section>
	),
	Heading: ({ children, tag }: PropsWithChildren<{ tag?: string }>): ReactElement => {
		if (tag === "h2") {
			return <h2>{children}</h2>;
		}
		if (tag === "h3") {
			return <h3>{children}</h3>;
		}
		return <h1>{children}</h1>;
	},
	Notice: ({
		children,
		noticeTitle,
	}: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Container: ({ children }: PropsWithChildren): ReactElement => <section>{children}</section>,
	Grid: ({ children }: PropsWithChildren): ReactElement => <div>{children}</div>,
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/fetch/rp-applications", async () => {
	const actual = await vi.importActual("@/fetch/rp-applications");
	return {
		...actual,
		getCurrentUserRPOAuthSetup: vi.fn(),
	};
});

const mockedGetCurrentUserRPOAuthSetup = vi.mocked(getCurrentUserRPOAuthSetup);

describe("YourApplicationsOAuthSetupPage", () => {
	beforeAll(() => {
		Object.defineProperty(globalThis, "location", {
			configurable: true,
			value: {
					pathname: "/your-applications/application-uuid-1",
				replace: replaceMock,
			} as Pick<Location, "pathname" | "replace">,
		});
	});

	afterEach(() => {
		replaceMock.mockReset();
		mockedGetCurrentUserRPOAuthSetup.mockReset();
	});

	afterAll(() => {
		Object.defineProperty(globalThis, "location", {
			configurable: true,
			value: originalLocation,
		});
	});

	it("renders read-only OAuth setup with a link to the dedicated client info page", async () => {
		mockedGetCurrentUserRPOAuthSetup.mockResolvedValue({
			applicationUrl: "https://benefits.example.gc.ca",
			discoveryEndpoint:
				"https://cds-gcsignin-dev.verify.ibm.com/oauth2/.well-known/openid-configuration",
			logoutRedirectUris: [
				"https://benefits.example.gc.ca/logout-complete",
			],
			logoutUri: "https://benefits.example.gc.ca/backchannel-logout",
			pkceEnabled: true,
			rpApplicationName: "Benefits Portal",
			redirectUris: ["https://benefits.example.gc.ca/callback"],
			status: "active",
		});

		render(<OAuthSetupPage />);

		await screen.findByRole("heading", { name: "Benefits Portal" });
		expect(screen.getByText("Logout URI:")).toBeTruthy();
		expect(
			screen.getByText("https://benefits.example.gc.ca/backchannel-logout")
		).toBeTruthy();
		expect(screen.getByText("Logout redirect URIs")).toBeTruthy();
		expect(
			screen.getByText("https://benefits.example.gc.ca/logout-complete")
		).toBeTruthy();
		expect(screen.getByRole("link", { name: "Manage credentials" })).toBeTruthy();

		const sectionHeadings = screen.getAllByRole("heading", { level: 2 });
		expect(sectionHeadings).toHaveLength(1);
		expect(sectionHeadings[0]?.textContent).toBe("OAuth setup");
	});

	it("redirects 403 to access denied", async () => {
		mockedGetCurrentUserRPOAuthSetup.mockRejectedValue(
			new HttpRequestError({ status: 403 })
		);

		render(<OAuthSetupPage />);

		await waitFor(() => {
			expect(replaceMock).toHaveBeenCalledWith("/access-denied");
		});
	});

	it("redirects 404 to not-found generic error route", async () => {
		mockedGetCurrentUserRPOAuthSetup.mockRejectedValue(
			new HttpRequestError({ status: 404 })
		);

		render(<OAuthSetupPage />);

		await waitFor(() => {
			expect(replaceMock).toHaveBeenCalledWith("/error?kind=not_found");
		});
	});

	it("redirects unexpected failures to unexpected generic error route", async () => {
		mockedGetCurrentUserRPOAuthSetup.mockRejectedValue(new Error("network"));

		render(<OAuthSetupPage />);

		await waitFor(() => {
			expect(replaceMock).toHaveBeenCalledWith("/error?kind=unexpected");
		});
	});

	it("redirects 409 rp_application_department_required to department-setup", async () => {
		mockedGetCurrentUserRPOAuthSetup.mockRejectedValue(
			new HttpRequestError({
				status: 409,
				code: "rp_application_department_required",
				message: "RP application department assignment is required",
			})
		);

		render(<OAuthSetupPage />);

		await waitFor(() => {
			expect(replaceMock).toHaveBeenCalledWith(
					"/your-applications/application-uuid-1/department-setup"
			);
		});
	});

	it("renders department row when department name is present", async () => {
		mockedGetCurrentUserRPOAuthSetup.mockResolvedValue({
			applicationUrl: null,
			discoveryEndpoint: null,
			departmentName: "Treasury Board of Canada Secretariat",
			departmentNameFr: null,
			logoutRedirectUris: [],
			logoutUri: null,
			pkceEnabled: null,
			rpApplicationName: "Benefits Portal",
			redirectUris: [],
			status: "active",
		});

		render(<OAuthSetupPage />);

		await screen.findByRole("heading", { name: "Benefits Portal" });
		expect(screen.getByText("Organization:")).toBeTruthy();
		expect(
			screen.getByText("Treasury Board of Canada Secretariat")
		).toBeTruthy();
	});

	it("does not render department row when department name is null", async () => {
		mockedGetCurrentUserRPOAuthSetup.mockResolvedValue({
			applicationUrl: null,
			discoveryEndpoint: null,
			departmentName: null,
			departmentNameFr: null,
			logoutRedirectUris: [],
			logoutUri: null,
			pkceEnabled: null,
			rpApplicationName: "Benefits Portal",
			redirectUris: [],
			status: "active",
		});

		render(<OAuthSetupPage />);

		await screen.findByRole("heading", { name: "Benefits Portal" });
		expect(screen.queryByText("Organization:")).toBeNull();
	});
});
