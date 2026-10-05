import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotFoundPage } from "@/features/errors/pages/NotFoundPage";
import { useSession, type SessionState } from "@/hooks";

vi.mock("@/hooks", () => ({
	useSession: vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string => {
			const map: Record<string, string> = {
				"genericError.notFoundApplicationsAction": "Go to Applications",
				"genericError.notFoundBody": "The page you're looking for may have moved, been removed, or the address may be incorrect.",
				"genericError.notFoundPartnerPortalAction": "Go to Partner Portal",
				"genericError.notFoundSupportLink": "CanadaLogin support",
				"genericError.notFoundSupportPrefix": "If the problem continues, contact",
				"genericError.notFoundTitle": "We cannot find that page",
			};
			return map[key] ?? key;
		},
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		href,
	}: PropsWithChildren<{ href?: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Link: ({ children, href }: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

const mockedUseSession = vi.mocked(useSession);

const createSessionState = (
	hasHydrated: boolean,
	isAuthenticated: boolean
): SessionState =>
	({
		currentUser: null,
		hasHydrated,
		isAuthenticated,
		isLoading: !hasHydrated,
		login: vi.fn(),
		logout: vi.fn().mockResolvedValue(undefined),
		refreshSession: vi.fn().mockResolvedValue(null),
	}) as SessionState;

describe("NotFoundPage", () => {
	it("links authenticated users to Applications", () => {
		mockedUseSession.mockReturnValue(createSessionState(true, true));

		render(<NotFoundPage />);

		expect(
			screen.getByRole("link", { name: "Go to Applications" }).getAttribute("href")
		).toBe("/applications");
		expect(screen.queryByRole("link", { name: "Go to Partner Portal" })).toBeNull();
	});

	it("waits for hydration before showing the signed-out action", () => {
		mockedUseSession.mockReturnValue(createSessionState(false, false));

		const { rerender } = render(<NotFoundPage />);

		expect(
			screen.queryByRole("link", { name: "Go to Partner Portal" })
		).toBeNull();

		mockedUseSession.mockReturnValue(createSessionState(true, false));
		rerender(<NotFoundPage />);

		expect(
			screen.getByRole("link", { name: "Go to Partner Portal" }).getAttribute("href")
		).toBe("/");
		expect(screen.queryByRole("link", { name: "Go to Applications" })).toBeNull();
	});

	it("renders not-found content without breadcrumbs", () => {
		mockedUseSession.mockReturnValue(createSessionState(true, false));

		render(<NotFoundPage />);

		expect(
			screen.getByRole("heading", { name: "We cannot find that page" })
		).toBeTruthy();
		expect(
			screen.getByText(
				"The page you're looking for may have moved, been removed, or the address may be incorrect."
			)
		).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "CanadaLogin support" }).getAttribute("href")
		).toBe("/support");
		expect(screen.queryByRole("navigation")).toBeNull();
	});
});