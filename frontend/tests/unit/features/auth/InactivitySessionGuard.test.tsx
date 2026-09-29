import type { PropsWithChildren, ReactElement, ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InactivitySessionGuard } from "@/features/auth/components/InactivitySessionGuard";
import { inactivityTimeoutConfig } from "@/features/auth/inactivity-timeout-config";
import type { SessionState } from "@/features/auth/hooks/use-session";
import { useSession } from "@/hooks";
import { getLastBackendActivityAt } from "@/lib/backend-activity";

vi.mock("@/hooks", () => ({
	useSession: vi.fn(),
}));

vi.mock("@/lib/backend-activity", () => ({
	getLastBackendActivityAt: vi.fn(),
	subscribeToBackendActivity: vi.fn(() => vi.fn()),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string, values?: Record<string, string>) => string;
	} => ({
		t: (key: string, values?: Record<string, string>): string => {
			const translations: Record<string, string> = {
				"sessionTimeout.continueAction": "Stay signed in",
				"sessionTimeout.continuingAction": "Staying signed in...",
				"sessionTimeout.countdownLabel": `Time remaining: ${values?.["time"] ?? ""}`,
				"sessionTimeout.loggingOutAction": "Signing out...",
				"sessionTimeout.logoutAction": "Sign out",
				"sessionTimeout.warningDescription":
					"If you do not continue your session you will be signed out automatically.",
				"sessionTimeout.warningTitle":
					"Your session is about to end due to inactivity",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({ buttonRole = "primary", children, onGcdsClick }: PropsWithChildren<{ buttonRole?: "primary" | "secondary" | "danger" | "start"; onGcdsClick: () => void }>): ReactElement => (
		<button data-button-role={buttonRole} type="button" onClick={onGcdsClick}>{children}</button>
	),
	Modal: ({ children, description, footer, showCloseButton = true, title }: PropsWithChildren<{ description?: string; footer?: ReactNode; showCloseButton?: boolean; title: string }>): ReactElement => (
		<div role="dialog" aria-label={title}>
			{showCloseButton ? <button type="button">Close</button> : null}
			{description ? <p>{description}</p> : null}
			{children}
			{footer}
		</div>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

const createSessionState = (
	refreshSession: SessionState["refreshSession"]
): SessionState => ({
	currentUser: null,
	isAuthenticated: true,
	isLoading: false,
	login: vi.fn(),
	logout: vi.fn().mockResolvedValue(undefined),
	refreshSession,
});

describe("InactivitySessionGuard", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-09-29T12:00:00Z"));
		vi.mocked(useSession).mockReturnValue(
			createSessionState(vi.fn().mockResolvedValue({}))
		);
		vi.mocked(getLastBackendActivityAt).mockReturnValue(
			Date.now() - inactivityTimeoutConfig.warningAfterMs
		);
	});

	it("shows a non-dismissable warning with the countdown and existing actions", async () => {
		const refreshSession = vi.fn().mockResolvedValue({});
		vi.mocked(useSession).mockReturnValue(createSessionState(refreshSession));

		render(<InactivitySessionGuard />);

		expect(
			screen.getByRole("dialog", {
				name: "Your session is about to end due to inactivity",
			})
		).toBeTruthy();
		expect(
			screen.getByText(
				"If you do not continue your session you will be signed out automatically."
			)
		).toBeTruthy();
		expect(screen.getByText("Time remaining: 5:00")).toBeTruthy();
		expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
		expect(
			screen.getByRole("button", { name: "Stay signed in" }).dataset
				["buttonRole"]
		).toBe("primary");
		expect(
			screen.getByRole("button", { name: "Sign out" }).dataset["buttonRole"]
		).toBe("secondary");

		fireEvent.click(screen.getByRole("button", { name: "Stay signed in" }));

		expect(refreshSession).toHaveBeenCalledTimes(1);
		expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
	});
});