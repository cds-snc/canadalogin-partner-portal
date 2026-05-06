import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { useSession } from "@/hooks";

type LoginLoaderData = {
	loginNotice: {
		bodyKey: string;
		titleKey: string;
	} | null;
};

const { useLoaderData } = vi.hoisted(() => ({
	useLoaderData: vi.fn<() => LoginLoaderData>(() => ({ loginNotice: null })),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"login.unauthorizedBody": "Your session is no longer valid. Sign in again to continue.",
				"login.unauthorizedTitle": "Sign in required",
				"login.expiredBody": "You are not logged in or your session expired. Sign in again to continue.",
				"login.expiredTitle": "Session expired",
				"login.title": "Sign in",
				"login.summary": "Start the OIDC sign-in flow through the backend.",
				"login.action": "Continue to sign in",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, onGcdsClick }: PropsWithChildren<{ onGcdsClick?: () => void }>): ReactElement => (
		<button onClick={onGcdsClick} type="button">{children}</button>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Notice: ({ children, noticeTitle }: PropsWithChildren<{ noticeTitle?: string }>): ReactElement => (
		<section>
			{noticeTitle ? <h2>{noticeTitle}</h2> : null}
			{children}
		</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/hooks", () => ({
	useSession: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	getRouteApi: () => ({
		useLoaderData,
	}),
}));

describe("LoginPage", () => {
	afterEach(() => {
		window.history.replaceState({}, "", "/login");
		useLoaderData.mockReset();
		useLoaderData.mockReturnValue({ loginNotice: null });
	});

	it("starts the login flow when the sign-in button is clicked", () => {
		const login = vi.fn();
		vi.mocked(useSession).mockReturnValue({
			currentUser: null,
			isLoading: false,
			isAuthenticated: false,
			login,
			logout: vi.fn((): Promise<void> => Promise.resolve()),
			refreshSession: vi.fn((): Promise<null> => Promise.resolve(null)),
		});

		render(<LoginPage />);

		fireEvent.click(screen.getByRole("button", { name: /continue to sign in/i }));

		expect(login).toHaveBeenCalledTimes(1);
	});

	it("shows an expired-session notice when redirected back to sign in", () => {
		window.history.replaceState({}, "", "/login?reason=expired");
		useLoaderData.mockReturnValue({
			loginNotice: {
				bodyKey: "login.expiredBody",
				titleKey: "login.expiredTitle",
			},
		});
		vi.mocked(useSession).mockReturnValue({
			currentUser: null,
			isLoading: false,
			isAuthenticated: false,
			login: vi.fn(),
			logout: vi.fn((): Promise<void> => Promise.resolve()),
			refreshSession: vi.fn((): Promise<null> => Promise.resolve(null)),
		});

		render(<LoginPage />);

		expect(screen.getByRole("heading", { name: /session expired/i })).toBeTruthy();
		expect(screen.getByText(/not logged in or your session expired/i)).toBeTruthy();
	});

	it("shows an unauthorized notice when redirected after a 401 response", () => {
		window.history.replaceState({}, "", "/login?reason=unauthorized&message=session-expired");
		useLoaderData.mockReturnValue({
			loginNotice: {
				bodyKey: "login.unauthorizedBody",
				titleKey: "login.unauthorizedTitle",
			},
		});
		vi.mocked(useSession).mockReturnValue({
			currentUser: null,
			isLoading: false,
			isAuthenticated: false,
			login: vi.fn(),
			logout: vi.fn((): Promise<void> => Promise.resolve()),
			refreshSession: vi.fn((): Promise<null> => Promise.resolve(null)),
		});

		render(<LoginPage />);

		expect(screen.getByRole("heading", { name: /sign in required/i })).toBeTruthy();
		expect(screen.getByText(/session is no longer valid/i)).toBeTruthy();
	});

	it("renders the finalized login notice from the route layer", () => {
		window.history.replaceState({}, "", "/login?reason=expired");
		useLoaderData.mockReturnValue({
			loginNotice: {
				bodyKey: "login.unauthorizedBody",
				titleKey: "login.unauthorizedTitle",
			},
		});
		vi.mocked(useSession).mockReturnValue({
			currentUser: null,
			isLoading: false,
			isAuthenticated: false,
			login: vi.fn(),
			logout: vi.fn((): Promise<void> => Promise.resolve()),
			refreshSession: vi.fn((): Promise<null> => Promise.resolve(null)),
		});

		render(<LoginPage />);

		expect(screen.getByRole("heading", { name: /sign in required/i })).toBeTruthy();
		expect(screen.queryByRole("heading", { name: /session expired/i })).toBeNull();
	});
});