import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessDeniedPage } from "@/features/auth/pages/AccessDeniedPage";

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"accessDenied.title": "Access denied",
				"accessDenied.noticeTitle": "You do not have access to this site",
				"accessDenied.summary":
					"Your account is signed in, but it is not in an allowed group for the Partner Portal.",
				"accessDenied.body":
					"Access is limited to users in the required authorization groups. If you believe this is incorrect, contact your administrator.",
				"accessDenied.action": "Sign out",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		onGcdsClick,
		buttonRole,
	}: PropsWithChildren<{
		onGcdsClick?: () => void;
		buttonRole?: string;
	}>): ReactElement => (
		<button data-button-role={buttonRole} type="button" onClick={onGcdsClick}>
			{children}
		</button>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => (
		<h1>{children}</h1>
	),
	Notice: ({
		children,
		noticeTitle,
	}: PropsWithChildren<{ noticeTitle?: string }>): ReactElement => (
		<section>
			{noticeTitle ? <h2>{noticeTitle}</h2> : null}
			{children}
		</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

describe("AccessDeniedPage", () => {
	let locationHref = "";

	beforeEach(() => {
		locationHref = "";

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

		expect(
			screen.getByRole("heading", { name: /access denied/i })
		).toBeTruthy();
		expect(
			screen.getByRole("heading", {
				name: /you do not have access to this site/i,
			})
		).toBeTruthy();
		expect(
			screen.getByText(/not in an allowed group for the partner portal/i)
		).toBeTruthy();
		expect(
			screen.getByText(
				/access is limited to users in the required authorization groups/i
			)
		).toBeTruthy();
		expect(screen.queryByText(/signing out in/i)).toBeNull();

		const signOutButton = screen.getByRole("button", { name: /sign out/i });
		expect(signOutButton.getAttribute("data-button-role")).toBe("primary");
		fireEvent.click(signOutButton);

		await waitFor(() => {
			expect(locationHref).toBe("/logout");
		});
	});
});
