import type { PropsWithChildren, ReactElement } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccessDeniedPage } from "@/features/auth/pages/AccessDeniedPage";

const { resetMock } = vi.hoisted(() => ({
	resetMock: vi.fn(),
}));

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
				"accessDenied.concurrentSessionNoticeTitle": "Session limit reached",
				"accessDenied.concurrentSessionSummary": "You have reached the maximum number of active Partner Portal sessions.",
				"accessDenied.concurrentSessionBody": "Sign out from another browser or device before trying again. Contact your administrator if you need help.",
			};

			if (key === "accessDenied.countdown") {
				const seconds = String(options?.["seconds"] ?? "");
				return (translations[key] ?? key).replace("{{seconds}}", seconds);
			}

			return translations[key] ?? key;
		},
	}),
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

vi.mock("@/store", () => ({
	useAuthStore: (selector: (state: { reset: () => void }) => unknown): unknown =>
		selector({ reset: resetMock }),
}));

afterEach(() => {
	vi.useRealTimers();
});

describe("AccessDeniedPage", () => {
	let locationHref = "";

	beforeEach(() => {
		locationHref = "";
		resetMock.mockReset();

		Object.defineProperty(window, "location", {
			configurable: true,
			value: {
				get href(): string {
					return locationHref;
				},
				set href(value: string) {
					locationHref = value;
				},
			},
		});
	});

	it("renders denied content and a sign-out action", async () => {
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
		expect(resetMock).toHaveBeenCalledTimes(1);

		await waitFor(() => {
			expect(locationHref).toBe("http://localhost:8000/api/v1/logout");
		});
	});

	it("auto-signs out after 10 seconds and navigates home", async () => {
		vi.useFakeTimers();

		render(<AccessDeniedPage />);
		await act(async () => {
			vi.advanceTimersByTime(10000);
		});
		await Promise.resolve();
		await Promise.resolve();

		expect(locationHref).toBe("http://localhost:8000/api/v1/logout");
		expect(resetMock).toHaveBeenCalledTimes(1);
	});

	it("renders concurrent session guidance when the limit is reached", () => {
		render(<AccessDeniedPage reason="concurrent-session-limit" />);

		expect(screen.getByRole("heading", { name: /session limit reached/i })).toBeTruthy();
		expect(
			screen.getByText(/maximum number of active partner portal sessions/i)
		).toBeTruthy();
		expect(screen.getByText(/sign out from another browser or device/i)).toBeTruthy();
	});
});
