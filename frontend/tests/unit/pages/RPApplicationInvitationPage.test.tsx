import type { PropsWithChildren, ReactElement } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenRequestError } from "@/fetch";
import { RPApplicationInvitationPage } from "@/features/invitations/pages/RPApplicationInvitationPage";
import { acceptRPApplicationDeveloperInvitation } from "@/fetch/rp-application-developer-invitations";

const navigate = vi.fn(
	(options: { replace?: boolean; to: string }): Promise<void> => {
		void options;
		return Promise.resolve();
	}
);

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string) => string } => ({
		t: (key: string): string => {
			const translations: Record<string, string> = {
				"invitations.rpApplication.dashboardAction": "Go to dashboard",
				"invitations.rpApplication.errorBody": "We could not accept this RP application invitation. The link may be invalid or expired.",
				"invitations.rpApplication.errorTitle": "Invitation unavailable",
				"invitations.rpApplication.loadingBody": "Checking your access and connecting you to the invited RP application.",
				"invitations.rpApplication.loadingTitle": "Accepting invitation",
				"invitations.rpApplication.missingTokenBody": "This invitation link is incomplete. Use the full link from your email invitation.",
				"invitations.rpApplication.missingTokenTitle": "Invitation link incomplete",
				"invitations.rpApplication.successBody": "Your access has been confirmed. If you are not redirected automatically, continue to your dashboard.",
				"invitations.rpApplication.successTitle": "Invitation accepted",
				"invitations.rpApplication.title": "RP application invitation",
			};

			return translations[key] ?? key;
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

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigate => navigate,
}));

vi.mock("@/fetch/rp-application-developer-invitations", () => ({
	acceptRPApplicationDeveloperInvitation: vi.fn(),
}));

describe("RPApplicationInvitationPage", () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	beforeEach(() => {
		navigate.mockReset();
	});

	it("renders the missing-token state when no token is provided", () => {
		render(<RPApplicationInvitationPage />);

		expect(
			screen.getByRole("heading", { name: /rp application invitation/i })
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: /invitation link incomplete/i })
		).toBeTruthy();
		expect(
			screen.getByText(/use the full link from your email invitation/i)
		).toBeTruthy();
	});

	it("renders the loading state while accepting the invitation", () => {
		vi.mocked(acceptRPApplicationDeveloperInvitation).mockReturnValue(
			new Promise(() => {
				// Keep pending to exercise the loading state.
			})
		);

		render(<RPApplicationInvitationPage token="token-123" />);

		expect(
			screen.getByRole("heading", { name: /accepting invitation/i })
		).toBeTruthy();
		expect(
			screen.getByText(/checking your access and connecting you/i)
		).toBeTruthy();
	});

	it("renders success and redirects to the dashboard after acceptance", async () => {
		vi.useFakeTimers();
		vi.mocked(acceptRPApplicationDeveloperInvitation).mockResolvedValue({
			accessGrant: {
				createdAt: "2026-08-10T12:15:00Z",
				deletedAt: null,
				id: 77,
				isDeleted: false,
				role: "Read Only",
				sourceInvitationUuid: "018f6f83-0000-0000-0000-000000000801",
				status: "active",
				updatedAt: null,
				userId: 42,
				uuid: "018f6f83-0000-0000-0000-000000000901",
				workspaceId: 9,
			},
			invitation: {
				acceptedAt: "2026-08-10T12:15:00Z",
				createdAt: "2026-08-10T12:00:00Z",
				delegatedByGrantUuid: null,
				deletedAt: null,
				gcNotifyNotificationId: null,
				id: 121,
				invitedBy: 42,
				invitedEmail: "invitee@example.gc.ca",
				inviteExpiresAt: "2026-08-20T12:00:00Z",
				isDeleted: false,
				rpApplicationId: 33,
				role: "Read Only",
				revokedAt: null,
				status: "accepted",
				updatedAt: "2026-08-10T12:15:00Z",
				uuid: "018f6f83-0000-0000-0000-000000000801",
				workspaceId: 9,
			},
		});

		render(<RPApplicationInvitationPage token="token-123" />);

		await act(async () => {
			await Promise.resolve();
		});
		expect(
			screen.getByRole("heading", { name: /invitation accepted/i })
		).toBeTruthy();
		expect(
			screen.getByText(/your access has been confirmed/i)
		).toBeTruthy();
		expect(
			screen.getByRole("link", { name: /go to dashboard/i })
		).toBeTruthy();

		await act(async () => {
			vi.advanceTimersByTime(1500);
		});

		expect(navigate).toHaveBeenCalledWith({
			replace: true,
			to: "/your-applications",
		});
	});

	it("renders the generic error state for failed acceptance", async () => {
		vi.mocked(acceptRPApplicationDeveloperInvitation).mockRejectedValue(
			new Error("Invitation expired")
		);

		render(<RPApplicationInvitationPage token="token-123" />);

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { name: /invitation unavailable/i })
			).toBeTruthy();
		});
		expect(
			screen.getByText(/the link may be invalid or expired/i)
		).toBeTruthy();
	});

	it("keeps access-restricted invitation failures on the invitation page", async () => {
		vi.mocked(acceptRPApplicationDeveloperInvitation).mockRejectedValue(
			new ForbiddenRequestError({ detail: "Signed-in email does not match this invitation" })
		);

		render(<RPApplicationInvitationPage token="token-123" />);

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { name: /invitation unavailable/i })
			).toBeTruthy();
		});
		expect(navigate).not.toHaveBeenCalled();
	});
});