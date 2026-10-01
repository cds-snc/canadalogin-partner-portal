import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignedOutPage } from "@/features/auth/pages/SignedOutPage";

const { loginMock } = vi.hoisted(() => ({
	loginMock: vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"signedOut.action": "Sign in again",
				"signedOut.expiredSummary": "You were signed out of the CanadaLogin Partner Portal because your session was inactive.",
				"signedOut.securityReminder": "For your security, close your browser if you're using a shared or public device.",
				"signedOut.summary": "You have successfully signed out of the CanadaLogin Partner Portal.",
				"signedOut.title": "You have signed out",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		onGcdsClick,
	}: PropsWithChildren<{ onGcdsClick?: () => void }>): ReactElement => (
		<button type="button" onClick={onGcdsClick}>
			{children}
		</button>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/store", () => ({
	useAuthStore: (selector: (state: { login: () => void }) => unknown): unknown =>
		selector({ login: loginMock }),
}));

describe("SignedOutPage", (): void => {
	beforeEach((): void => {
		loginMock.mockReset();
	});

	it("shows the normal logout content when no reason is provided", (): void => {
		render(<SignedOutPage />);

		expect(screen.getByRole("heading", { name: "You have signed out" })).toBeTruthy();
		expect(
			screen.getByText(
				"You have successfully signed out of the CanadaLogin Partner Portal."
			)
		).toBeTruthy();
		expect(
			screen.queryByText(/because your session was inactive/i)
		).toBeNull();
	});

	it("shows the inactivity message for an expired session", (): void => {
		render(<SignedOutPage reason="session-expired" />);

		expect(
			screen.getByText(
				"You were signed out of the CanadaLogin Partner Portal because your session was inactive."
			)
		).toBeTruthy();
		expect(
			screen.queryByText(
				"You have successfully signed out of the CanadaLogin Partner Portal."
			)
		).toBeNull();
	});

	it("starts a new sign-in when the user selects sign in again", (): void => {
		render(<SignedOutPage />);

		fireEvent.click(screen.getByRole("button", { name: "Sign in again" }));

		expect(loginMock).toHaveBeenCalledTimes(1);
	});
});