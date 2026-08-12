import type { ReactElement, ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Header from "@/components/ui/Header";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";
import { useSession } from "@/hooks";

const { navigateMock, routerState, toggleLanguageMock } = vi.hoisted(() => ({
	navigateMock: vi.fn(),
	routerState: {
		matches: [
			{
				context: {
					breadcrumbs: [
						{ href: "/", label: "Home" },
						{ href: "/users", label: "Users" },
					],
				},
			},
		],
		pathname: "/users",
	},
	toggleLanguageMock: vi.fn(() => Promise.resolve()),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string) => string;
		i18n: { language: string };
	} => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"nav.administration": "Administration",
				"nav.dashboard": "Dashboard",
				"nav.health": "Health",
				"home.title": "CanadaLogin Partner Portal",
				"nav.home": "Home",
				"nav.label": "Primary navigation",
				"nav.login": "Sign in",
				"nav.logout": "Sign out",
				"nav.onboardingOversight": "Onboarding oversight",
				"nav.partnerWork": "Partner work",
				"nav.partnerWorkClose": "Close Partner work menu",
				"nav.reports": "Reports",
				"nav.rpRegistrationAdoption": "Adopt existing RP registrations",
				"nav.policies": "Policies",
				"nav.roles": "Roles",
				"nav.tiers": "Tiers",
				"nav.users": "Users",
				"nav.workspaces": "Workspaces",
				"workspaces.navigation.rpApplications": "RP applications",
			};
			return translations[key] ?? key;
		},
		i18n: { language: "en" },
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigateMock => navigateMock,
	useRouterState: ({
		select,
	}: {
		select: (state: {
			location: { pathname: string };
			matches: Array<{
				context?: {
					breadcrumbs?: Array<{
						href: string;
						label: string;
					}>;
				};
			}>;
		}) => unknown;
	}): unknown =>
		select({
			location: { pathname: routerState.pathname },
			matches: routerState.matches,
		}),
}));

vi.mock("@/hooks", () => ({
	useDevSession: vi.fn(() => ({
		clearSession: vi.fn(),
		currentFixture: null,
		devSession: null,
		error: null,
		isClearing: false,
		isLoading: false,
		isSelecting: false,
		selectFixture: vi.fn(),
	})),
	useAppPreferencesState: vi.fn(() => ({
		language: "en",
		setLanguage: vi.fn(),
		toggleLanguage: toggleLanguageMock,
	})),
	useSession: vi.fn(),
}));

vi.mock("@/features/workspaces/hooks/use-workspace", () => ({
	useWorkspace: vi.fn(),
}));

vi.mock("@tanstack/react-query", async () => {
	const actual = await vi.importActual("@tanstack/react-query");
	return {
		...actual,
		useQuery: vi.fn(() => ({ data: null, isLoading: false, error: null })),
	};
});

vi.mock("@gcds-core/components-react", () => ({
	GcdsBreadcrumbs: ({
		children,
		lang,
	}: {
		children: ReactNode;
		lang?: string;
	}): ReactElement => (
		<div data-testid="gcds-breadcrumbs" lang={lang}>
			{children}
		</div>
	),
	GcdsBreadcrumbsItem: ({
		children,
	}: {
		children: ReactNode;
	}): ReactElement => <span>{children}</span>,
	GcdsHeader: ({
		children,
		lang,
	}: {
		children: ReactNode;
		lang?: string;
	}): ReactElement => (
		<header data-testid="gcds-header" lang={lang}>
			{children}
		</header>
	),
	GcdsLangToggle: ({
		href,
		lang,
		onGcdsClick,
	}: {
		href: string;
		lang: string;
		onGcdsClick?: (event: Event) => void;
	}): ReactElement => (
		<button
			data-href={href}
			type="button"
			onClick={(event) => onGcdsClick?.(event.nativeEvent)}
		>
			Lang:{lang}
		</button>
	),
	GcdsLink: ({
		children,
		href,
	}: {
		children: ReactNode;
		href: string;
	}): ReactElement => <a href={href}>{children}</a>,
	GcdsNavGroup: ({
		children,
		menuLabel,
	}: {
		children: ReactNode;
		menuLabel: string;
		openTrigger?: string;
	}): ReactElement => <ul aria-label={menuLabel}>{children}</ul>,
	GcdsNavLink: ({
		children,
		href,
		current,
	}: {
		children: ReactNode;
		href: string;
		current?: boolean;
	}): ReactElement => (
		<a aria-current={current ? "page" : undefined} data-href={href} href={href}>
			{children}
		</a>
	),
	GcdsTopNav: ({
		children,
		lang,
		label,
	}: {
		children: ReactNode;
		lang?: string;
		label: string;
	}): ReactElement => (
		<nav aria-label={label} data-testid="gcds-top-nav" lang={lang}>
			{children}
		</nav>
	),
}));

describe("Header", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		routerState.pathname = "/users";
		routerState.matches = [
			{
				context: {
					breadcrumbs: [
						{ href: "/", label: "Home" },
						{ href: "/users", label: "Users" },
					],
				},
			},
		];
		vi.mocked(useWorkspace).mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			workspace: null,
		} as never);
	});

	it("propagates the active language to stateful GCDS navigation elements", () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: null,
			isAuthenticated: false,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn((): Promise<void> => Promise.resolve()),
			refreshSession: vi.fn((): Promise<null> => Promise.resolve(null)),
		});

		render(<Header />);

		expect(screen.getByTestId("gcds-header").getAttribute("lang")).toBe("en");
		expect(screen.getByTestId("gcds-top-nav").getAttribute("lang")).toBe("en");
		expect(screen.getByTestId("gcds-breadcrumbs").getAttribute("lang")).toBe(
			"en"
		);
	});

	it("renders navigation for authenticated superuser", () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				acceptedTermsAt: "2026-06-11T12:00:00Z",
				authorizationContext: {
					globalRole: "cl_admin",
					partnerAccess: [],
				},
				departmentAbbreviation: "TBS",
				departmentUuid: "department-uuid-1",
				name: "Jane Doe",
				email: "jane@example.com",
				profileImageUrl: "https://example.com/jane.png",
				termsVersion: "2026-01",
				tierUuid: "tier-uuid-2",
				uuid: "user-uuid-7",
				username: "jane@example.com",
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn((): Promise<void> => Promise.resolve()),
			refreshSession: vi.fn((): Promise<null> => Promise.resolve(null)),
		});

		render(<Header />);

		expect(
			document.querySelector("nav[aria-label='Primary navigation']")
		).toBeTruthy();
		expect(
			document.querySelector("a[data-href='/workspaces']")?.textContent
		).toBe("Workspaces");
		expect(
			document.querySelector("a[data-href='/administration']")?.textContent
		).toBe("Administration");
		expect(
			document.querySelector("a[data-href='/onboarding-oversight']")
				?.textContent
		).toBe("Onboarding oversight");
		expect(document.querySelector("a[data-href='/reports']")?.textContent).toBe(
			"Reports"
		);
		expect(document.querySelector("a[data-href='/users']")).toBeNull();
		expect(
			document
				.querySelector("a[data-href='/administration']")
				?.getAttribute("aria-current")
		).toBe("page");
	});

	it("groups only the authorized Partner work destinations", () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				acceptedTermsAt: "2026-06-11T12:00:00Z",
				authorizationContext: {
					globalRole: null,
					partnerAccess: [
						{ role: "rp_admin", workspaceUuid: "workspace-uuid-1" },
					],
				},
				departmentAbbreviation: "TBS",
				departmentUuid: "department-uuid-1",
				email: "partner@example.com",
				name: "Partner Admin",
				profileImageUrl: "",
				termsVersion: "2026-01",
				tierUuid: null,
				uuid: "user-uuid-8",
				username: "partner@example.com",
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn((): Promise<void> => Promise.resolve()),
			refreshSession: vi.fn((): Promise<null> => Promise.resolve(null)),
		});

		render(<Header />);

		expect(
			document.querySelector("ul[aria-label='Partner work']")
		).toBeTruthy();
		expect(
			document.querySelector("a[data-href='/your-applications']")
		).toBeTruthy();
		expect(document.querySelector("a[data-href='/workspaces']")).toBeTruthy();
		expect(document.querySelector("a[data-href='/reports']")).toBeTruthy();
		expect(document.querySelector("a[data-href='/administration']")).toBeNull();
	});

	it("renders public sign-in link when no session exists", () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: null,
			isAuthenticated: false,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn((): Promise<void> => Promise.resolve()),
			refreshSession: vi.fn((): Promise<null> => Promise.resolve(null)),
		});

		render(<Header />);

		expect(
			document.querySelector("nav[aria-label='Primary navigation']")
		).toBeTruthy();
		expect(document.querySelector("a[data-href='/support']")).toBeNull();
	});

	it("uses workspace names and task labels for selected-workspace breadcrumbs", () => {
		routerState.pathname =
			"/workspaces/workspace-uuid-1/applications/rp-application-uuid-1";
		routerState.matches = [];
		vi.mocked(useWorkspace).mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn(),
			workspace: { name: "Benefits Workspace", uuid: "workspace-uuid-1" },
		} as never);
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: {
					globalRole: null,
					partnerAccess: [
						{ role: "rp_admin", workspaceUuid: "workspace-uuid-1" },
					],
				},
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(),
			refreshSession: vi.fn(),
		} as never);

		render(<Header />);

		expect(screen.getByText("Benefits Workspace")).toBeTruthy();
		expect(screen.getByText("RP applications")).toBeTruthy();
		expect(document.body.textContent).not.toContain("workspace-uuid-1");
	});

	it("uses only parent hierarchy for the RP adoption task breadcrumb", () => {
		routerState.pathname = "/workspaces/rp-registration-adoption";
		routerState.matches = [];
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: {
					globalRole: "cl_admin",
					partnerAccess: [],
				},
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(),
			refreshSession: vi.fn(),
		} as never);

		render(<Header />);

		expect(screen.getByTestId("gcds-breadcrumbs").textContent).toBe(
			"HomeWorkspaces"
		);
		expect(useWorkspace).toHaveBeenCalledWith("");
	});

	it("links the adoption parent while omitting the focused review step", () => {
		routerState.pathname =
			"/workspaces/rp-registration-adoption/rp-application-uuid-1";
		routerState.matches = [
			{
				context: {
					breadcrumbLabel: "Review RP registration",
				},
			},
		] as never;
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				authorizationContext: {
					globalRole: "cl_admin",
					partnerAccess: [],
				},
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(),
			refreshSession: vi.fn(),
		} as never);

		render(<Header />);

		expect(screen.getByTestId("gcds-breadcrumbs").textContent).toBe(
			"HomeWorkspacesAdopt existing RP registrations"
		);
	});

	it("changes language through the shared preference and preserves the equivalent route", async () => {
		const browserUser = userEvent.setup();
		vi.mocked(useSession).mockReturnValue({
			currentUser: null,
			isAuthenticated: false,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn((): Promise<void> => Promise.resolve()),
			refreshSession: vi.fn((): Promise<null> => Promise.resolve(null)),
		});

		render(<Header />);
		const languageControl = screen.getByRole("button", { name: "Lang:en" });
		expect(languageControl.getAttribute("data-href")).toBe("/users");

		await browserUser.click(languageControl);

		await waitFor(() => expect(toggleLanguageMock).toHaveBeenCalledOnce());
		expect(navigateMock).toHaveBeenCalledWith({
			replace: true,
			to: "/users",
		});
	});
});
