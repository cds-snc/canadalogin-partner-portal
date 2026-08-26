import type { PropsWithChildren, ReactElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RPApplicationInvitationPreparePage } from "@/features/invitations/pages/RPApplicationInvitationPreparePage";
import { prepareRPApplicationDeveloperInvitation } from "@/fetch/rp-application-developer-invitations";

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
				"invitations.rpApplication.title": "Partner workspace invitation",
			};
			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@/components/ui", () => ({
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
	prepareRPApplicationDeveloperInvitation: vi.fn(),
}));

describe("RPApplicationInvitationPreparePage", () => {
	beforeEach(() => {
		navigate.mockReset();
		globalThis.history.replaceState({}, "", "/");
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("scrubs the fragment before preparing and navigates with a tokenless path", async () => {
		globalThis.history.replaceState(
			{ source: "manual-link" },
			"",
			"/invitations/rp-applications/prepare?token=query-secret#token=opaque-token-value"
		);
		vi.mocked(prepareRPApplicationDeveloperInvitation).mockResolvedValue();

		render(<RPApplicationInvitationPreparePage />);

		expect(
			screen.getByRole("heading", { name: /partner workspace invitation/i })
		).toBeTruthy();
		expect(globalThis.location.hash).toBe("");
		expect(globalThis.location.pathname).toBe(
			"/invitations/rp-applications/prepare"
		);
		expect(globalThis.location.search).toBe("");
		expect(prepareRPApplicationDeveloperInvitation).toHaveBeenCalledWith(
			"opaque-token-value"
		);

		await waitFor(() => {
			expect(navigate).toHaveBeenCalledWith({
				replace: true,
				to: "/invitations/rp-applications/accept",
			});
		});
		expect(JSON.stringify(navigate.mock.calls)).not.toContain(
			"opaque-token-value"
		);
	});

	it("rejects a missing or ambiguous fragment without making a request", async () => {
		globalThis.history.replaceState(
			{},
			"",
			"/invitations/rp-applications/prepare#token=one&token=two"
		);

		render(<RPApplicationInvitationPreparePage />);

		expect(globalThis.location.hash).toBe("");
		await waitFor(() => {
			expect(
				screen.getByRole("heading", { name: /invitation link incomplete/i })
			).toBeTruthy();
		});
		expect(prepareRPApplicationDeveloperInvitation).not.toHaveBeenCalled();
		expect(navigate).not.toHaveBeenCalled();
	});

	it("shows one generic unavailable result when preparation fails", async () => {
		globalThis.history.replaceState(
			{},
			"",
			"/invitations/rp-applications/prepare#token=invalid-token"
		);
		vi.mocked(prepareRPApplicationDeveloperInvitation).mockRejectedValue(
			new Error("not found")
		);

		render(<RPApplicationInvitationPreparePage />);

		await waitFor(() => {
			expect(
				screen.getByRole("heading", { name: /invitation unavailable/i })
			).toBeTruthy();
		});
		expect(globalThis.location.hash).toBe("");
		expect(navigate).not.toHaveBeenCalled();
	});
});
