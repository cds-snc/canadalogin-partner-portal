import type { PropsWithChildren, ReactElement } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccessDeniedPage } from "@/features/auth/pages/AccessDeniedPage";

const logoutMock = vi.fn<() => Promise<void>>(() => Promise.resolve());
const navigateMock = vi.fn<
	(options: { replace: boolean; to: string }) => Promise<void>
>(() => Promise.resolve());

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"accessDenied.title": "Access denied",
				"accessDenied.noticeTitle": "You do not have access to this site",
				"accessDenied.summary": "Your account is signed in, but it is not in an allowed group for the Partner Portal.",
				"accessDenied.body": "Access is limited to users in the required authorization groups. If you believe this is incorrect, contact your administrator.",
				"accessDenied.countdown": "Signing out in {{seconds}} seconds.",
				"accessDenied.action": "Sign out",
			};

			if (key === "accessDenied.countdown") {
				const seconds = String(options?.["seconds"] ?? "");
				return (translations[key] ?? key).replace("{{seconds}}", seconds);
			}

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): ((options: { replace: boolean; to: string }) => Promise<void>) =>
		navigateMock,
}));

vi.mock("@/hooks", () => ({
	useSession: (): { logout: () => Promise<void> } => ({ logout: logoutMock }),
}));

vi.mock("@/components/layout", () => ({
	CenteredPageLayout: ({ children }: PropsWithChildren): ReactElement => <main>{children}</main>,
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		onGcdsClick,
		buttonRole,
	}: PropsWithChildren<{ onGcdsClick?: () => void; buttonRole?: string }>): ReactElement => (
		<button data-button-role={buttonRole} type="button" onClick={onGcdsClick}>
			{children}
		</button>
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

afterEach(() => {
	vi.useRealTimers();
});

describe("AccessDeniedPage", () => {
	it("renders denied content and a sign-out action", async () => {
		logoutMock.mockClear();
		navigateMock.mockClear();
		render(<AccessDeniedPage />);

		expect(screen.getByRole("heading", { name: /access denied/i })).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: /you do not have access to this site/i })
		).toBeTruthy();
		expect(
			screen.getByText(/not in an allowed group for the partner portal/i)
		).toBeTruthy();
		expect(
			screen.getByText(/access is limited to users in the required authorization groups/i)
		).toBeTruthy();
		expect(screen.getByText(/signing out in 10 seconds/i)).toBeTruthy();

		const signOutButton = screen.getByRole("button", { name: /sign out/i });
		expect(signOutButton.getAttribute("data-button-role")).toBe("primary");
		fireEvent.click(signOutButton);

		await waitFor(() => {
			expect(logoutMock).toHaveBeenCalledTimes(1);
			expect(navigateMock).toHaveBeenCalledWith({ replace: true, to: "/" });
		});
	});

	it("auto-signs out after 10 seconds and navigates home", async () => {
		vi.useFakeTimers();
		logoutMock.mockClear();
		navigateMock.mockClear();

		render(<AccessDeniedPage />);
		await act(async () => {
			vi.advanceTimersByTime(10000);
		});
		await Promise.resolve();
		await Promise.resolve();

		expect(logoutMock).toHaveBeenCalledTimes(1);
		expect(navigateMock).toHaveBeenCalledWith({ replace: true, to: "/" });
	});
});
