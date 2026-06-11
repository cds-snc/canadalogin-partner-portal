import type { PropsWithChildren, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSession, type SessionState } from "@/hooks";
import { Home } from "@/pages/Home";

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"home.featureSectionTitle": "Manage RP applications",
				"home.heroEyebrow": "Partner portal",
				"home.heroTitle": "Manage your relying party applications in one place.",
				"home.signInAction": "Sign in with CanadaLogin",
				"home.signOutAction": "Sign out",
				"home.summary": "Access the CanadaLogin Partner Portal to configure, and monitor relying party applications connected to the CanadaLogin service.",
				"home.title": "CanadaLogin Partner Portal",
				"home.aboutCardTitle": "About this portal",
				"home.aboutCardDescription": "Learn about the CanadaLogin Partner Portal and how it supports relying party application management.",
				"home.federalCardTitle": "System health",
				"home.federalCardDescription": "Check the current health and readiness of the CanadaLogin backend services.",
				"home.optionalCardTitle": "Terms and conditions",
				"home.optionalCardDescription": "Review the terms and conditions for using the Partner Portal.",
				"home.dashboardPageLink": "Go to dashboard",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@gcds-core/components-react", () => ({
	GcdsLink: ({ children, ...properties }: PropsWithChildren<Record<string, unknown>>): ReactElement => <a {...properties}>{children}</a>,
	GcdsNotice: ({ children }: PropsWithChildren): ReactElement => <section>{children}</section>,
}));

vi.mock("@/components", () => ({
	Button: ({ children, onGcdsClick }: PropsWithChildren<{ onGcdsClick?: () => void }>): ReactElement => <button onClick={onGcdsClick}>{children}</button>,
	Card: ({ cardTitle, description }: { cardTitle: string; description?: string }): ReactElement => <article><h2>{cardTitle}</h2><p>{description}</p></article>,
	Grid: ({ children }: PropsWithChildren): ReactElement => <section>{children}</section>,
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Link: ({ children, href }: PropsWithChildren<{ href: string }>): ReactElement => <a href={href}>{children}</a>,
	Notice: ({ children }: PropsWithChildren): ReactElement => <section>{children}</section>,
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/hooks", () => ({
	useSession: vi.fn(),
}));

const mockedUseSession = vi.mocked(useSession);

const createSessionState = (overrides: Partial<SessionState>): SessionState => ({
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
			</QueryClientProvider>,
		);

		expect(
			screen.getByRole("heading", { name: /canadalogin partner portal/i }),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: /manage your relying party applications in one place/i }),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: /manage rp applications/i }),
		).toBeTruthy();
		expect(
			screen.getByRole("button", { name: /sign in with canadalogin/i }),
		).toBeTruthy();
	});

	it("shows the signed-in user and a sign-out action when authenticated", () => {
		mockedUseSession.mockReturnValue(createSessionState({
			currentUser: {
				name: "Jane Doe",
				email: "jane@example.com",
				profileImageUrl: "https://example.com/avatar.png",
				authProvider: "gc-sso",
				authSubject: "subject-123",
				roleUuids: ["role-uuid-2"],
				tierUuid: "tier-uuid-3",
				uuid: "user-uuid-7",
			},
			isLoading: false,
			isAuthenticated: true,
		}));

		const queryClient = new QueryClient();

		render(
			<QueryClientProvider client={queryClient}>
				<Home />
			</QueryClientProvider>,
		);

		expect(screen.getByRole("button", { name: /go to dashboard/i })).toBeTruthy();
		expect(screen.getByRole("button", { name: /sign out/i })).toBeTruthy();
	});
});