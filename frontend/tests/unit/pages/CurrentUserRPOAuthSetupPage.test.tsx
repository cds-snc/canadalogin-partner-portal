import type { PropsWithChildren, ReactElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { CurrentUserRPOAuthSetupPage } from "@/features/rp-applications/pages/CurrentUserRPOAuthSetupPage";
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
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string => {
			const map: Record<string, string> = {
				"nav.home": "Home",
				"nav.dashboard": "Dashboard",
				"rpOAuthSetup.applicationSectionTitle": "Application details",
				"rpOAuthSetup.applicationUrlLabel": "Application URL",
				"rpOAuthSetup.discoveryEndpointLabel": "Discovery endpoint",
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
				"workspaces.clientCredentials": "Client credentials",
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

describe("CurrentUserRPOAuthSetupPage", () => {
	beforeAll(() => {
		Object.defineProperty(globalThis, "location", {
			configurable: true,
			value: {
				pathname: "/rp-applications/mine/application-uuid-1",
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

		render(<CurrentUserRPOAuthSetupPage />);

		await screen.findByRole("heading", { name: "Benefits Portal" });
		expect(screen.getByText("Discovery endpoint:")).toBeTruthy();
		expect(
			screen.getByText(
				"https://cds-gcsignin-dev.verify.ibm.com/oauth2/.well-known/openid-configuration"
			)
		).toBeTruthy();
		expect(screen.getByText("Logout URI:")).toBeTruthy();
		expect(
			screen.getByText("https://benefits.example.gc.ca/backchannel-logout")
		).toBeTruthy();
		expect(screen.getByText("Logout redirect URIs")).toBeTruthy();
		expect(
			screen.getByText("https://benefits.example.gc.ca/logout-complete")
		).toBeTruthy();
		expect(screen.getByRole("button", { name: "Client credentials" })).toBeTruthy();

		const sectionHeadings = screen.getAllByRole("heading", { level: 2 });
		expect(sectionHeadings[0]?.textContent).toBe("Application details");
		expect(sectionHeadings[1]?.textContent).toBe("OAuth setup");
	});

	it("redirects 403 to access denied", async () => {
		mockedGetCurrentUserRPOAuthSetup.mockRejectedValue(
			new HttpRequestError({ status: 403 })
		);

		render(<CurrentUserRPOAuthSetupPage />);

		await waitFor(() => {
			expect(replaceMock).toHaveBeenCalledWith("/access-denied");
		});
	});

	it("redirects 404 to not-found generic error route", async () => {
		mockedGetCurrentUserRPOAuthSetup.mockRejectedValue(
			new HttpRequestError({ status: 404 })
		);

		render(<CurrentUserRPOAuthSetupPage />);

		await waitFor(() => {
			expect(replaceMock).toHaveBeenCalledWith("/error?kind=not_found");
		});
	});

	it("redirects unexpected failures to unexpected generic error route", async () => {
		mockedGetCurrentUserRPOAuthSetup.mockRejectedValue(new Error("network"));

		render(<CurrentUserRPOAuthSetupPage />);

		await waitFor(() => {
			expect(replaceMock).toHaveBeenCalledWith("/error?kind=unexpected");
		});
	});
});
