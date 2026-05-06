import type { PropsWithChildren, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSession, type SessionState } from "@/hooks";
import { Home } from "@/pages/Home";

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string, options?: Record<string, string>) => string } => ({
		t: (key: string, options?: Record<string, string>): string => {
			const translations: Record<string, string> = {
					"home.featureAccess": "Protect frontend routes with backend session checks and role-aware navigation.",
					"home.featureContent": "Review sample pages and protected CRUD flows that exercise the API integration.",
					"home.featureObservability": "Verify backend readiness, health, and session behavior from the same shell.",
					"home.featureSectionTitle": "What this starter includes",
				"home.backendOrigin": `Backend origin: ${options?.["origin"] ?? ""}`,
					"home.heroEyebrow": "Session-first frontend",
					"home.heroTitle": "Build secure service flows on top of a practical frontend shell.",
				"home.signInAction": "Sign in with GC identity provider",
				"home.signOutAction": "Sign out",
					"home.statusPanelTitle": "Current session status",
				"home.signedInBody": `Signed in as ${options?.["name"] ?? ""}.`,
				"home.signedInEmail": `Email: ${options?.["email"] ?? ""}`,
				"home.signedInTitle": "You are signed in",
				"home.signedInUsername": `Username: ${options?.["username"] ?? ""}`,
				"home.signedOutBody": "Use session-based authentication through the backend to start the OIDC flow and return with a valid app session.",
				"home.signedOutTitle": "Sign in to continue",
					"home.supportingLinksTitle": "Common next steps",
				"home.summary": "This frontend now targets a session-first BFF-style integration with the backend for OIDC authentication and protected API access.",
				"home.title": "Digital service delivery starter",
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
			screen.getByRole("heading", { name: /digital service delivery starter/i }),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: /build secure service flows on top of a practical frontend shell/i }),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: /current session status/i }),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: /what this starter includes/i }),
		).toBeTruthy();
		expect(
			screen.getByRole("button", { name: /sign in with gc identity provider/i }),
		).toBeTruthy();
		expect(
			screen.getByText(/session-based authentication through the backend/i),
		).toBeTruthy();
		expect(
			screen.getAllByText(/protect frontend routes with backend session checks/i),
		).toHaveLength(2);
	});

	it("shows the signed-in user and a sign-out action when authenticated", () => {
		mockedUseSession.mockReturnValue(createSessionState({
			currentUser: {
				name: "Jane Doe",
				username: "jdoe",
				email: "jane@example.com",
				"profileImageUrl": "https://example.com/avatar.png",
				"authProvider": "gc-sso",
				"authSubject": "subject-123",
				"roleUuids": ["role-uuid-2"],
				"tierUuid": "tier-uuid-3",
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

		expect(screen.getByRole("heading", { name: /current session status/i })).toBeTruthy();
		expect(screen.getByText(/signed in as jane doe/i)).toBeTruthy();
		expect(screen.getByRole("button", { name: /sign out/i })).toBeTruthy();
	});
});