import type { PropsWithChildren, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSession, type SessionState } from "@/hooks";
import { Home } from "@/pages/Home";

vi.mock("@tanstack/react-router", () => ({
	useSearch: (): { redirect?: string } => ({ redirect: undefined }),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		i18n: { language: string };
		t: (key: string) => string;
	} => ({
		i18n: { language: "en" },
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"home.authenticated.administrationDescription": "Manage platform work.",
				"home.authenticated.administrationLinkDescription":
					"Open administration.",
				"home.authenticated.onboardingOversightDescription":
					"Monitor onboarding.",
				"home.authenticated.onboardingOversightLinkDescription":
					"Open onboarding oversight.",
				"home.authenticated.partnerWorkDescription": "Continue partner work.",
				"home.authenticated.reportsDescription": "Find reports.",
				"home.authenticated.reportsLinkDescription": "Open reports.",
				"home.authenticated.summary": "Choose a task area.",
				"home.authenticated.workspacesLinkDescription": "Choose a workspace.",
				"home.authenticated.yourApplicationsLinkDescription":
					"Review applications.",
				"home.featureSectionTitle": "Manage RP applications",
				"home.heroEyebrow": "Partner portal",
				"home.heroTitle":
					"Manage your relying party applications in one place.",
				"home.signInAction": "Sign in with CanadaLogin",
				"home.summary":
					"Use your Government of Canada email address to sign in.",
				"home.title": "CanadaLogin Partner Portal",
				"home.supportCardTitle": "Support",
				"home.supportCardDescription":
					"Get help with the CanadaLogin Partner Portal.",
				"nav.administration": "Administration",
				"nav.dashboard": "Your applications",
				"nav.onboardingOversight": "Onboarding oversight",
				"nav.partnerWork": "Partner work",
				"nav.reports": "Reports",
				"nav.workspaces": "Workspaces",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@gcds-core/components-react", () => ({
	GcdsLink: ({
		children,
		...properties
	}: PropsWithChildren<Record<string, unknown>>): ReactElement => (
		<a {...properties}>{children}</a>
	),
	GcdsNotice: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
	),
}));

vi.mock("@/components", () => ({
	Button: ({
		children,
		onGcdsClick,
	}: PropsWithChildren<{ onGcdsClick?: () => void }>): ReactElement => (
		<button onClick={onGcdsClick}>{children}</button>
	),
	Card: ({
		cardTitle,
		description,
		href,
	}: {
		cardTitle: string;
		description?: string;
		href: string;
	}): ReactElement => (
		<article>
			<h3>
				<a href={href}>{cardTitle}</a>
			</h3>
			<p>{description}</p>
		</article>
	),
	Container: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
	Grid: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag: "h1" | "h2" | "h3" }>): ReactElement => {
		if (tag === "h2") return <h2>{children}</h2>;
		if (tag === "h3") return <h3>{children}</h3>;
		return <h1>{children}</h1>;
	},
	Link: ({
		children,
		href,
	}: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Notice: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/hooks", () => ({
	useSession: vi.fn(),
}));

vi.mock("@/features/auth/components/LocalPersonaSelector", () => ({
	LocalPersonaSelector: (): null => null,
}));

const mockedUseSession = vi.mocked(useSession);

const createSessionState = (
	overrides: Partial<SessionState>
): SessionState => ({
	currentUser: null,
	isLoading: false,
	isAuthenticated: false,
	login: vi.fn(),
	logout: vi.fn((): Promise<void> => Promise.resolve()),
	refreshSession: vi.fn((): Promise<null> => Promise.resolve(null)),
	...overrides,
});

describe("Home", () => {
	it("shows a public sign-in call to action when the user is signed out", () => {
		mockedUseSession.mockReturnValue(createSessionState({}));

		const queryClient = new QueryClient();

		render(
			<QueryClientProvider client={queryClient}>
				<Home />
			</QueryClientProvider>
		);

		expect(
			screen.getByRole("heading", { name: /canadalogin partner portal/i })
		).toBeTruthy();
		expect(
			screen.getByRole("button", { name: /sign in with canadalogin/i })
		).toBeTruthy();
	});

	it("shows only partner task areas for an authenticated RP Admin", () => {
		mockedUseSession.mockReturnValue(
			createSessionState({
				currentUser: {
					acceptedTermsAt: "2026-06-11T12:00:00Z",
					authorizationContext: {
						globalRole: null,
						partnerAccess: [
							{ role: "rp_admin", workspaceUuid: "workspace-uuid-1" },
						],
					},
					departmentAbbreviation: null,
					departmentUuid: null,
					email: "partner@local.example",
					name: "Partner Admin",
					profileImageUrl: "",
					termsVersion: "2026-01",
					tierUuid: null,
					uuid: "user-uuid-1",
					username: "partner@local.example",
				},
				isAuthenticated: true,
			})
		);

		render(<Home />);

		expect(screen.getByRole("heading", { name: "Partner work" })).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: "Your applications" })
				.getAttribute("href")
		).toBe("/your-applications");
		expect(
			screen.getByRole("link", { name: "Workspaces" }).getAttribute("href")
		).toBe("/workspaces");
		expect(
			screen.queryByRole("heading", { name: "Administration" })
		).toBeNull();
	});

	it("shows CL Admin task areas without partner application access", () => {
		mockedUseSession.mockReturnValue(
			createSessionState({
				currentUser: {
					acceptedTermsAt: "2026-06-11T12:00:00Z",
					authorizationContext: {
						globalRole: "cl_admin",
						partnerAccess: [],
					},
					departmentAbbreviation: "CDS",
					departmentUuid: "department-uuid-1",
					email: "admin@local.example",
					name: "CL Admin",
					profileImageUrl: "",
					termsVersion: "2026-01",
					tierUuid: null,
					uuid: "user-uuid-2",
					username: "admin@local.example",
				},
				isAuthenticated: true,
			})
		);

		render(<Home />);

		expect(
			screen.getByRole("heading", {
				level: 2,
				name: "Onboarding oversight",
			})
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: "Reports", level: 2 })
		).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "Reports" }).getAttribute("href")
		).toBe("/reports");
		expect(
			screen.getByRole("heading", { level: 2, name: "Administration" })
		).toBeTruthy();
		expect(
			screen.queryByRole("link", { name: "Your applications" })
		).toBeNull();
	});
});
