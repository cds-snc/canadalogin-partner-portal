import {
	createRef,
	forwardRef,
	type FocusEventHandler,
	type ReactElement,
	type ReactNode,
} from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserNavGroup } from "@/components/ui/UserNavGroup";
import { useSession, type SessionState } from "@/hooks";

vi.mock("@/hooks", () => ({
	useSession: vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		t: (key: string, options = {}): string => {
			const translations: Record<string, string> = {
				"nav.account": "Account",
				"nav.accountMenuTrigger": "{{name}} — {{context}}",
				"nav.logout": "Sign out",
			};
			return (translations[key] ?? key).replace(
				/\{\{(?<name>\w+)\}\}/g,
				(_match: string, name: string) => String(options[name] ?? "")
			);
		},
	}),
}));

vi.mock("@gcds-core/components-react", () => ({
	GcdsNavGroup: forwardRef<
		HTMLDivElement,
		{
			children: ReactNode;
			menuLabel: string;
			onBlurCapture?: FocusEventHandler<HTMLDivElement>;
			openTrigger?: string;
		}
	>(({ children, menuLabel, onBlurCapture }, ref): ReactElement => (
		<div ref={ref} aria-label={menuLabel} onBlurCapture={onBlurCapture}>
			{children}
		</div>
	)),
	GcdsNavLink: ({
		children,
		href,
		onGcdsClick,
	}: {
		children: ReactNode;
		href: string;
		onGcdsClick?: () => void;
	}): ReactElement => (
		<a href={href} onClick={onGcdsClick}>
			{children}
		</a>
	),
}));

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
		email: "partner@example.com",
		name: "Partner Admin",
		profileImageUrl: "",
		termsVersion: "2026-01",
		tierUuid: null,
		uuid: "user-uuid",
		username: "partner@example.com",
	},
	isAuthenticated: true,
	isLoading: false,
	login: vi.fn(),
	logout: vi.fn(() => Promise.resolve()),
	refreshSession: vi.fn(() => Promise.resolve(null)),
	...overrides,
});

const renderUserNavigation = (onRequestClose = vi.fn()) => {
	const navGroupRef =
		createRef<HTMLGcdsNavGroupElement>() as React.RefObject<HTMLGcdsNavGroupElement>;
	return {
		...render(
			<UserNavGroup
				contextLabel="RP Admin, Benefits Workspace"
				navGroupRef={navGroupRef}
				onRequestClose={onRequestClose}
			/>
		),
		onRequestClose,
	};
};

describe("UserNavGroup", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useSession).mockReturnValue(createSessionState());
	});

	it("keeps the account disclosure compact and exposes only account actions", () => {
		renderUserNavigation();

		expect(
			screen.getByLabelText("Partner Admin — RP Admin, Benefits Workspace")
		).toBeTruthy();
		expect(screen.getAllByRole("link")).toHaveLength(2);
		expect(
			screen.getByRole("link", { name: "Account" }).getAttribute("href")
		).toBe("/account");
		expect(
			screen.getByRole("link", { name: "Sign out" }).getAttribute("href")
		).toBe("/logout");
		expect(screen.queryByText("partner@example.com")).toBeNull();
		expect(screen.queryByText("workspace-alpha-uuid")).toBeNull();
	});

	it("requests disclosure dismissal when a destination is selected", async () => {
		const browserUser = userEvent.setup();
		const { onRequestClose } = renderUserNavigation();

		await browserUser.click(screen.getByRole("link", { name: "Account" }));

		expect(onRequestClose).toHaveBeenCalledWith(false);
	});

	it("renders nothing when the authenticated user record is unavailable", () => {
		vi.mocked(useSession).mockReturnValue(
			createSessionState({ currentUser: null, isAuthenticated: false })
		);

		const { container } = renderUserNavigation();

		expect(container.innerHTML).toBe("");
	});
});
