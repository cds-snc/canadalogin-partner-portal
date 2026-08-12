import type { ReactElement, ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserNavGroup } from "@/components/ui/UserNavGroup";
import type { DevSessionFixture } from "@/fetch/dev-session";
import {
	useDevSession,
	useSession,
	type DevSessionState,
	type SessionState,
} from "@/hooks";

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigateMock => navigateMock,
}));

vi.mock("@tanstack/react-query", () => ({
	useQuery: vi.fn(() => ({ data: null })),
}));

vi.mock("@/hooks", () => ({
	useDevSession: vi.fn(),
	useSession: vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		t: (key: string, options = {}): string => {
			const translations: Record<string, string> = {
				"authorization.roles.rpAdmin": "RP Admin",
				"authorization.workspaceRoleNameContext":
					"{{role}} — {{workspaceName}}",
				"localDevPersona.clearAction": "Clear simulated session",
				"localDevPersona.clearErrorBody":
					"The simulated session could not be cleared.",
				"localDevPersona.clearErrorTitle":
					"Unable to clear the simulated session",
				"localDevPersona.clearingAction": "Clearing simulated session...",
				"localDevPersona.simulatedIdentity":
					"Signed in as {{name}} ({{email}}).",
				"localDevPersona.simulatedSessionLabel": "Simulated local session",
				"nav.logout": "Sign out",
				"nav.organization": "Organization",
				"nav.roles": "Roles",
				"yourApplications.noDepartment": "No organization",
			};
			return (translations[key] ?? key).replace(
				/\{\{(?<name>\w+)\}\}/g,
				(_match: string, name: string) => String(options[name] ?? "")
			);
		},
	}),
}));

vi.mock("@gcds-core/components-react", () => ({
	GcdsButton: ({
		children,
		disabled,
		onClickCapture,
		onKeyDownCapture,
		onKeyUpCapture,
	}: {
		children: ReactNode;
		disabled?: boolean;
		onClickCapture?: React.MouseEventHandler<HTMLButtonElement>;
		onKeyDownCapture?: React.KeyboardEventHandler<HTMLButtonElement>;
		onKeyUpCapture?: React.KeyboardEventHandler<HTMLButtonElement>;
	}): ReactElement => (
		<button
			disabled={disabled}
			type="button"
			onClickCapture={onClickCapture}
			onKeyDownCapture={onKeyDownCapture}
			onKeyUpCapture={onKeyUpCapture}
		>
			{children}
		</button>
	),
	GcdsNavGroup: ({
		children,
		menuLabel,
	}: {
		children: ReactNode;
		menuLabel: string;
	}): ReactElement => <div aria-label={menuLabel}>{children}</div>,
	GcdsNavLink: ({
		children,
		href,
	}: {
		children: ReactNode;
		href: string;
	}): ReactElement => <a href={href}>{children}</a>,
	GcdsNotice: ({
		children,
		noticeRole,
		noticeTitle,
	}: {
		children: ReactNode;
		noticeRole: string;
		noticeTitle: string;
	}): ReactElement => (
		<section role={noticeRole === "danger" ? "alert" : undefined}>
			<h4>{noticeTitle}</h4>
			{children}
		</section>
	),
}));

const currentFixture: DevSessionFixture = {
	email: "local-rp-admin@local.example",
	fixtureId: "local-rp-admin",
	globalRole: null,
	name: "Local RP Admin",
	partnerAccess: [
		{
			role: "rp_admin",
			workspaceName: "Workspace Alpha",
			workspaceUuid: "workspace-alpha-uuid",
		},
	],
};

const createSessionState = (
	overrides: Partial<SessionState> = {}
): SessionState => ({
	currentUser: {
		acceptedTermsAt: "2026-06-11T12:00:00Z",
		authorizationContext: {
			globalRole: null,
			partnerAccess: [
				{ role: "rp_admin", workspaceUuid: "workspace-alpha-uuid" },
			],
		},
		departmentAbbreviation: "TBS",
		departmentUuid: null,
		email: "local-rp-admin@local.example",
		name: "Local RP Admin",
		profileImageUrl: "",
		termsVersion: "2026-01",
		tierUuid: null,
		uuid: "user-uuid",
		username: "local-rp-admin@local.example",
	},
	isAuthenticated: true,
	isLoading: false,
	login: vi.fn(),
	logout: vi.fn(() => Promise.resolve()),
	refreshSession: vi.fn(() => Promise.resolve(null)),
	...overrides,
});

const createDevSessionState = (
	overrides: Partial<DevSessionState> = {}
): DevSessionState => ({
	clearSession: vi.fn(() => Promise.resolve()),
	currentFixture: null,
	devSession: null,
	error: null,
	isClearing: false,
	isLoading: false,
	isSelecting: false,
	selectFixture: vi.fn(() => Promise.resolve()),
	...overrides,
});

describe("UserNavGroup local simulation summary", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(useSession).mockReturnValue(createSessionState());
		vi.mocked(useDevSession).mockReturnValue(createDevSessionState());
	});

	it("does not show a simulated label without a confirmed current fixture", () => {
		render(<UserNavGroup />);

		expect(screen.queryByText("Simulated local session")).toBeNull();
		expect(
			screen.getByRole("link", { name: "Sign out" }).getAttribute("href")
		).toBe("/logout");
	});

	it("shows the safe simulated identity after GET confirms the current fixture", () => {
		vi.mocked(useDevSession).mockReturnValue(
			createDevSessionState({ currentFixture })
		);

		render(<UserNavGroup />);

		expect(screen.getByText("Simulated local session")).toBeTruthy();
		expect(
			screen.getByText(
				"Signed in as Local RP Admin (local-rp-admin@local.example)."
			)
		).toBeTruthy();
		expect(screen.getByText("RP Admin — Workspace Alpha")).toBeTruthy();
		expect(screen.queryByText(/workspace-alpha-uuid/i)).toBeNull();
	});

	it("clears the backend session, refreshes /user/me, and returns home", async () => {
		const browserUser = userEvent.setup();
		const clearSession = vi.fn(() => Promise.resolve());
		const refreshSession = vi.fn(() => Promise.resolve(null));
		vi.mocked(useDevSession).mockReturnValue(
			createDevSessionState({ clearSession, currentFixture })
		);
		vi.mocked(useSession).mockReturnValue(
			createSessionState({ refreshSession })
		);
		render(<UserNavGroup />);

		await browserUser.click(
			screen.getByRole("button", { name: "Clear simulated session" })
		);

		await waitFor(() => {
			expect(clearSession).toHaveBeenCalledTimes(1);
		});
		expect(refreshSession).toHaveBeenCalledTimes(1);
		expect(navigateMock).toHaveBeenCalledWith({ replace: true, to: "/" });
	});

	it("keeps the session visible and reports a clear failure", async () => {
		const browserUser = userEvent.setup();
		vi.mocked(useDevSession).mockReturnValue(
			createDevSessionState({
				clearSession: vi.fn(() => Promise.reject(new Error("failed"))),
				currentFixture,
			})
		);
		render(<UserNavGroup />);

		await browserUser.click(
			screen.getByRole("button", { name: "Clear simulated session" })
		);

		const errorMessage = await screen.findByText(
			"The simulated session could not be cleared."
		);
		expect(errorMessage.closest("section")?.getAttribute("role")).toBe("alert");
		expect(navigateMock).not.toHaveBeenCalled();
	});

	it("disables the clear action while the request is pending", () => {
		vi.mocked(useDevSession).mockReturnValue(
			createDevSessionState({ currentFixture, isClearing: true })
		);

		render(<UserNavGroup />);

		const action = screen.getByRole("button", {
			name: "Clearing simulated session...",
		});
		expect((action as HTMLButtonElement).disabled).toBe(true);
	});
});
