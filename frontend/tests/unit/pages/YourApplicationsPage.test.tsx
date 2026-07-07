import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { YourApplicationsPage } from "@/features/your-applications/pages/YourApplicationsPage";
import { useSession } from "@/hooks";

const { mockedUseQuery } = vi.hoisted(() => ({
	mockedUseQuery: vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string, options?: Record<string, unknown>) => string } => ({
		t: (key: string, _options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"yourApplications.loadingBody": "Loading your applications.",
				"yourApplications.loadingTitle": "Loading your applications",
				"yourApplications.noRPApplications": "No RP applications found.",
				"yourApplications.summary": "Select an application to manage.",
				"yourApplications.title": "Your applications",
				"yourApplications.unknownApplication": "Unknown application",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-query", () => ({
	useQuery: mockedUseQuery,
}));

vi.mock("@/components/layout", () => ({
	Breadcrumbs: (): ReactElement => <nav>Breadcrumbs</nav>,
}));

vi.mock("@/components/ui", () => ({
	Card: ({ cardTitle, href }: { cardTitle?: string; href?: string }): ReactElement => (
		href ? <a href={href}>{cardTitle}</a> : <div>{cardTitle}</div>
	),
	Container: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
	),
	Grid: ({ children }: PropsWithChildren): ReactElement => <div>{children}</div>,
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Link: ({ children, href }: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Notice: ({ children, noticeTitle }: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/hooks", () => ({
	useSession: vi.fn(),
}));

const mockedUseSession = vi.mocked(useSession);

describe("YourApplicationsPage", () => {
	it("renders the application list with links", () => {
		mockedUseQuery.mockReturnValue({
			data: [
				{ dnrAppName: "Benefits Portal", uuid: "application-uuid-1" },
				{ dnrAppName: "Claims Service", uuid: "application-uuid-2" },
			],
			error: null,
			isLoading: false,
		});

		mockedUseSession.mockReturnValue({
			currentUser: {
				authProvider: "gc-sso",
				authSubject: "subject-123",
				departmentUuid: "department-uuid-1",
				email: "jane@example.com",
				name: "Jane Doe",
				profileImageUrl: null,
				roleUuids: [],
				tierUuid: null,
				uuid: "user-uuid-1",
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		});

		render(<YourApplicationsPage />);

		expect(screen.getByRole("heading", { name: /your applications/i })).toBeTruthy();
		expect(screen.getByRole("link", { name: /^benefits portal$/i })).toBeTruthy();
		expect(screen.getByRole("link", { name: /^claims service$/i })).toBeTruthy();
		expect(
			screen.getByRole("link", { name: /^benefits portal$/i }).getAttribute("href")
		).toBe("/your-applications/application-uuid-1");
		expect(screen.getAllByRole("link").length).toBe(2);
	});
});
