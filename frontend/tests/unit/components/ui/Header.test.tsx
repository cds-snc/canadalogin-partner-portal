import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Header from "@/components/ui/Header";
import { useSession } from "@/hooks";

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string) => string;
		i18n: { language: string };
	} => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
					"nav.account": "Your account",
				"nav.apiDocumentation": "API Documentation",
				"nav.applications": "Applications",
				"nav.backTo": "Back to",
				"nav.dashboard": "Dashboard",
				"nav.health": "Health",
				"home.title": "CanadaLogin Partner Portal",
				"nav.home": "Home",
				"nav.label": "Primary navigation",
				"nav.login": "Sign in",
				"nav.logout": "Sign out",
					"nav.manageProfile": "Manage profile",
					"nav.organization": "Organization",
				"nav.policies": "Policies",
				"nav.roles": "Roles",
				"nav.tiers": "Tiers",
				"nav.users": "Users",
			};
			return translations[key] ?? key;
		},
		i18n: { language: "en" },
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): ((options: { to: string }) => void) =>
		vi.fn() as unknown as (options: { to: string }) => void,
	useRouterState: ({
		select,
	}: {
		select: (state: {
			location: { pathname: string };
			matches: Array<{
				context?: {
					backLink?: {
						href: string;
						label: string;
						showBackLabel?: boolean;
					};
				};
			}>;
		}) => unknown;
	}): unknown =>
		select({
			location: { pathname: "/users" },
			matches: [
				{
					context: {
						backLink: {
							href: "#",
							label: "Applications",
							showBackLabel: false,
						},
					},
				},
			],
		}),
}));

vi.mock("@/hooks", () => ({
	useSession: vi.fn(),
	useRoles: vi.fn(() => ({ roles: [], isLoading: false, error: null })),
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
		slot,
	}: {
		children: ReactNode;
		slot?: string;
	}): ReactElement => (
		<nav data-slot={slot}>{children}</nav>
	),
	GcdsBreadcrumbsItem: ({
		children,
		href,
	}: {
		children: ReactNode;
		href: string;
	}): ReactElement => (
		<a href={href}>{children}</a>
	),
	GcdsHeader: ({ children }: { children: ReactNode }): ReactElement => (
		<header>{children}</header>
	),
	GcdsLangToggle: ({
		lang,
	}: {
		lang: string;
		href: string;
	}): ReactElement => <span>Lang:{lang}</span>,
	GcdsLink: ({ children, href }: { children: ReactNode; href: string }): ReactElement => (
		<a href={href}>{children}</a>
	),
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
		<a
			aria-current={current ? "page" : undefined}
			data-href={href}
			href={href}
		>
			{children}
		</a>
	),
	GcdsTopNav: ({
		children,
		label,
	}: {
		children: ReactNode;
		label: string;
	}): ReactElement => <nav aria-label={label}>{children}</nav>,
}));

describe("Header", () => {
	it("renders navigation for authenticated superuser", () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				name: "Jane Doe",
				email: "jane@example.com",
				profileImageUrl: "https://example.com/jane.png",
				authProvider: "gc-sso",
				authSubject: "subject-123",
				roleUuids: ["role-uuid-3"],
				tierUuid: "tier-uuid-2",
				uuid: "user-uuid-7",
				isSuperuser: true,
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
		expect(document.querySelector("nav[data-slot='breadcrumb']")).toBeTruthy();
		expect(document.querySelector("a[data-href='/your-applications']")?.textContent).toBe(
			"Applications"
		);
		expect(document.querySelector("a[data-href='#']")?.textContent).toBe(
			"API Documentation"
		);
		expect(document.querySelector("a[href='#']")?.textContent).toBe("Applications");
		expect(
			document.querySelector(
				"nav[aria-label='Primary navigation'] > a[data-href='/logout']"
			)
		).toBeNull();
		expect(document.querySelector("a[data-href='/profile/setup']")?.textContent).toBe(
			"Manage profile"
		);
		expect(document.querySelector("a[data-href='/logout']")?.textContent).toBe(
			"Sign out"
		);
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
	});
});
