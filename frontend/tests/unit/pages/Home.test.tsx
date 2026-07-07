import type { PropsWithChildren, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSession, type SessionState } from "@/hooks";
import { Home } from "@/pages/Home";

vi.mock("react-i18next", () => ({
	useTranslation: (): { i18n: { language: string }; t: (key: string) => string } => ({
		i18n: { language: "en" },
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"home.featureSectionTitle": "Manage RP applications",
				"home.heroEyebrow": "Partner portal",
				"home.heroTitle": "Manage your relying party applications in one place.",
				"home.signInAction": "Sign in with CanadaLogin",
				"home.summary": "Use your Government of Canada email address to sign in.",
				"home.title": "CanadaLogin Partner Portal",
				"home.supportCardTitle": "Support",
				"home.supportCardDescription": "Get help with the CanadaLogin Partner Portal.",
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
	Container: ({ children }: PropsWithChildren): ReactElement => <div>{children}</div>,
	Grid: ({ children }: PropsWithChildren): ReactElement => <div>{children}</div>,
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
			screen.getByRole("button", { name: /sign in with canadalogin/i }),
		).toBeTruthy();
	});
});