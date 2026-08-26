import type { PropsWithChildren, ReactElement } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenRequestError } from "@/fetch";
import { RPApplicationInvitationPage } from "@/features/invitations/pages/RPApplicationInvitationPage";
import { acceptPreparedRPApplicationDeveloperInvitation } from "@/fetch/rp-application-developer-invitations";

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
				"invitations.rpApplication.dashboardAction": "Go to partner workspace",
				"invitations.rpApplication.errorBody":
					"We could not accept this partner workspace invitation. The link may be invalid or expired.",
				"invitations.rpApplication.errorTitle": "Invitation unavailable",
				"invitations.rpApplication.loadingBody":
					"Checking your identity and confirming access to the invited partner workspace.",
				"invitations.rpApplication.loadingTitle": "Accepting invitation",
				"invitations.rpApplication.missingTokenBody":
					"This invitation link is incomplete. Use the full invitation link you received.",
				"invitations.rpApplication.missingTokenTitle":
					"Invitation link incomplete",
				"invitations.rpApplication.successBody":
					"Your partner workspace access has been confirmed. If you are not redirected automatically, continue to the partner workspace.",
				"invitations.rpApplication.successTitle": "Invitation accepted",
				"invitations.rpApplication.title": "Partner workspace invitation",
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

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigate => navigate,
}));

vi.mock("@/fetch/rp-application-developer-invitations", () => ({
	acceptPreparedRPApplicationDeveloperInvitation: vi.fn(),
}));

describe("RPApplicationInvitationPage", () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	beforeEach(() => {
		navigate.mockReset();
	});

	it("renders the loading state while accepting the invitation", () => {
		vi.mocked(acceptPreparedRPApplicationDeveloperInvitation).mockReturnValue(
			new Promise(() => {
				// Keep pending to exercise the loading state.
			})
		);

		render(<RPApplicationInvitationPage />);

		expect(
			screen.getByRole("heading", { name: /partner workspace invitation/i })
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: /accepting invitation/i })
		).toBeTruthy();
		expect(
			screen.getByText(/checking your identity and confirming access/i)
		).toBeTruthy();
	});

	it("renders success and redirects to the partner workspace after acceptance", async () => {
		vi.useFakeTimers();
		vi.mocked(acceptPreparedRPApplicationDeveloperInvitation).mockResolvedValue(
			{
				accessGrant: {
					createdAt: "2026-08-10T12:15:00Z",
					role: "read_only",
					revokedAt: null,
					sourceInvitationUuid: "018f6f83-0000-0000-0000-000000000801",
					status: "active",
					updatedAt: null,
					uuid: "018f6f83-0000-0000-0000-000000000901",
				},
				invitation: {
					acceptedAt: "2026-08-10T12:15:00Z",
					createdAt: "2026-08-10T12:00:00Z",
					delegatedByGrantUuid: null,
					invitedEmail: "invitee@example.gc.ca",
					inviteExpiresAt: "2026-08-20T12:00:00Z",
					replacedByInvitationUuid: null,
					revocationReason: null,
					role: "read_only",
					revokedAt: null,
					status: "accepted",
					updatedAt: "2026-08-10T12:15:00Z",
					uuid: "018f6f83-0000-0000-0000-000000000801",
				},
				nextDestination: "/workspaces/018f6f83-0000-0000-0000-000000000201",
			}
		);

		render(<RPApplicationInvitationPage />);

		await act(async () => {
			await Promise.resolve();
		});
		expect(
			screen.getByRole("heading", { name: /invitation accepted/i })
		).toBeTruthy();
		expect(
			screen.getByText(/your partner workspace access has been confirmed/i)
		).toBeTruthy();
		expect(
			screen.getByRole("link", { name: /go to partner workspace/i })
		).toBeTruthy();

		await act(async () => {
			vi.advanceTimersByTime(1500);
		});

		expect(navigate).toHaveBeenCalledWith({
			params: {
				workspaceUuid: "018f6f83-0000-0000-0000-000000000201",
			},
			replace: true,
			to: "/workspaces/$workspaceUuid",
		});
	});

	it("renders the generic error state for failed acceptance", async () => {
		vi.mocked(acceptPreparedRPApplicationDeveloperInvitation).mockRejectedValue(
			new Error("Invitation expired")
		);

		render(<RPApplicationInvitationPage />);

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
		vi.mocked(acceptPreparedRPApplicationDeveloperInvitation).mockRejectedValue(
			new ForbiddenRequestError({
				detail: "Signed-in email does not match this invitation",
			})
		);

		render(<RPApplicationInvitationPage />);

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { name: /invitation unavailable/i })
			).toBeTruthy();
		});
		expect(navigate).not.toHaveBeenCalled();
	});
});
