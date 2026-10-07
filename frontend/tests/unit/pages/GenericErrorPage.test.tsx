import type { PropsWithChildren, ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GenericErrorPage } from "@/features/errors/pages/GenericErrorPage";
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
				"genericError.notFoundPartnerPortalAction": "Go to CanadaLogin Partner Portal",
				"genericError.notFoundSupportLink": "CanadaLogin support",
				"genericError.notFoundSupportPrefix": "If the problem continues, contact",
				"genericError.notFoundTitle": "We could not find that page",
				"genericError.unexpectedBody": "There was a problem loading the page. You can return to CanadaLogin or try again later.",
				"genericError.unexpectedTitle": "We're having trouble loading this page",
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
	Container: ({ children }: PropsWithChildren): ReactElement => <div>{children}</div>,
	Heading: ({ children, tag }: PropsWithChildren<{ tag?: string }>): ReactElement => {
		if (tag === "h2") {
			return <h2>{children}</h2>;
		}
		return <h1>{children}</h1>;
	},
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

describe("GenericErrorPage", () => {
	it("renders the unexpected error content and signed-in action", () => {
		mockedUseSession.mockReturnValue(createSessionState(true, true));

		render(<GenericErrorPage kind="unexpected" />);

		expect(
			screen.getByRole("heading", {
				name: "We're having trouble loading this page",
			})
		).toBeTruthy();
		expect(
			screen.getByText(
				/there was a problem loading the page\. you can return to canadalogin or try again later\./i
			)
		).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "CanadaLogin support" }).getAttribute("href")
		).toBe("/support");
		expect(
			screen.getByRole("link", { name: "Go to Applications" }).getAttribute("href")
		).toBe("/applications");
		expect(
			screen.queryByRole("link", { name: "Go to CanadaLogin Partner Portal" })
		).toBeNull();
	});

	it("shows the portal action for signed-out users after session hydration", () => {
		mockedUseSession.mockReturnValue(createSessionState(false, false));

		const { rerender } = render(<GenericErrorPage kind="unexpected" />);

		expect(
			screen.queryByRole("link", { name: "Go to CanadaLogin Partner Portal" })
		).toBeNull();

		mockedUseSession.mockReturnValue(createSessionState(true, false));
		rerender(<GenericErrorPage kind="unexpected" />);

		expect(
			screen.getByRole("link", {
				name: "Go to CanadaLogin Partner Portal",
			}).getAttribute("href")
		).toBe("/");
	});
});
