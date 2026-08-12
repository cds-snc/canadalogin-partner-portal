import type { PropsWithChildren, ReactElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserRead } from "@/fetch/auth";
import type { DevSessionFixture, DevSessionRead } from "@/fetch/dev-session";
import { LocalPersonaSelector } from "@/features/auth/components/LocalPersonaSelector";
import { getAuthorizationLandingPath } from "@/features/auth/auth-routing";
import {
	UnknownDevSessionFixtureError,
	useDevSession,
	type DevSessionState,
} from "@/features/auth/hooks/use-dev-session";
import { useSession, type SessionState } from "@/hooks";

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigateMock => navigateMock,
}));

vi.mock("@/features/auth/auth-routing", () => ({
	getAuthorizationLandingPath: vi.fn(() => "/your-applications"),
}));

vi.mock("@/features/auth/hooks/use-dev-session", () => {
	class MockUnknownDevSessionFixtureError extends Error {
		public constructor() {
			super("Unknown local persona");
			this.name = "UnknownDevSessionFixtureError";
		}
	}

	return {
		UnknownDevSessionFixtureError: MockUnknownDevSessionFixtureError,
		useDevSession: vi.fn(),
	};
});

vi.mock("@/hooks", () => ({ useSession: vi.fn() }));

const translations: Record<string, string> = {
	"authorization.roles.clAdmin": "CL Admin",
	"authorization.roles.readOnly": "Read Only",
	"authorization.roles.rpAdmin": "RP Admin",
	"authorization.roles.rpUserEdit": "RP User (Edit)",
	"localDevPersona.availabilityErrorBody":
		"The backend did not confirm whether local persona simulation is available.",
	"localDevPersona.availabilityErrorTitle": "Unable to load local personas",
	"localDevPersona.chooseFixture": "Choose a simulated persona",
	"localDevPersona.continueAction": "Continue as simulated user",
	"localDevPersona.fixtureOption": "{{name}} — {{role}}",
	"localDevPersona.invalidFixtureBody":
		"The selected persona is not in the backend allowlist.",
	"localDevPersona.localOnlyBody": "This is not a real sign-in.",
	"localDevPersona.localOnlyTitle": "Local development only",
	"localDevPersona.noAccessRole": "No access",
	"localDevPersona.selectedAccess": "Simulated access: {{access}}",
	"localDevPersona.selectedIdentity": "{{name}} ({{email}})",
	"localDevPersona.selectedTitle": "Selected simulation",
	"localDevPersona.selectionErrorBody":
		"The backend did not start the session.",
	"localDevPersona.selectionErrorTitle":
		"Unable to start the simulated session",
	"localDevPersona.selectingAction": "Starting simulated session...",
	"localDevPersona.selectorHint":
		"Choose a backend-allowlisted fixture persona. The browser cannot submit an arbitrary role.",
	"localDevPersona.selectorLabel": "Simulated persona",
	"localDevPersona.title": "Try a simulated local persona",
	"localDevPersona.workspaceRole": "{{role}} in {{workspace}}",
};

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		t: (key: string, options = {}): string => {
			const template = translations[key] ?? key;
			return template.replace(
				/\{\{(?<name>\w+)\}\}/g,
				(_match: string, name: string) => String(options[name] ?? "")
			);
		},
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		disabled,
		onGcdsClick,
	}: PropsWithChildren<{
		disabled?: boolean;
		onGcdsClick?: () => void;
	}>): ReactElement => (
		<button disabled={disabled} type="button" onClick={onGcdsClick}>
			{children}
		</button>
	),
	Container: ({
		children,
		id,
	}: PropsWithChildren<{ id?: string }>): ReactElement => (
		<section id={id}>{children}</section>
	),
	Heading: ({
		children,
		tag: Tag,
	}: PropsWithChildren<{ tag: "h1" | "h2" | "h3" }>): ReactElement => (
		<Tag>{children}</Tag>
	),
	Notice: ({
		children,
		noticeTitle,
	}: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section>
			<h3>{noticeTitle}</h3>
			{children}
		</section>
	),
	Select: ({
		children,
		hint,
		label,
		onInput,
		selectId,
		value,
	}: PropsWithChildren<{
		hint?: string;
		label: string;
		onInput?: React.FormEventHandler<HTMLSelectElement>;
		selectId: string;
		value?: string;
	}>): ReactElement => (
		<div>
			<label htmlFor={selectId}>{label}</label>
			{hint ? <p>{hint}</p> : null}
			<select id={selectId} value={value} onInput={onInput}>
				{children}
			</select>
		</div>
	),
	Text: ({
		ariaLive,
		children,
	}: PropsWithChildren<{
		ariaLive?: "assertive" | "off" | "polite";
	}>): ReactElement => <p aria-live={ariaLive}>{children}</p>,
}));

const fixtures: Array<DevSessionFixture> = [
	{
		email: "local-cl-admin@local.example",
		fixtureId: "local-cl-admin",
		globalRole: "cl_admin",
		name: "Local CL Admin",
		partnerAccess: [],
	},
	{
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
	},
	{
		email: "local-rp-user-edit@local.example",
		fixtureId: "local-rp-user-edit",
		globalRole: null,
		name: "Local RP User Edit",
		partnerAccess: [
			{
				role: "rp_user_edit",
				workspaceName: "Workspace Alpha",
				workspaceUuid: "workspace-alpha-uuid",
			},
		],
	},
	{
		email: "local-read-only@local.example",
		fixtureId: "local-read-only",
		globalRole: null,
		name: "Local Read Only",
		partnerAccess: [
			{
				role: "read_only",
				workspaceName: "Workspace Alpha",
				workspaceUuid: "workspace-alpha-uuid",
			},
		],
	},
	{
		email: "local-no-access@local.example",
		fixtureId: "local-no-access",
		globalRole: null,
		name: "Local No Access",
		partnerAccess: [],
	},
];

const devSession: DevSessionRead = {
	currentFixtureId: null,
	enabled: true,
	fixtures,
};

const user: UserRead = {
	acceptedTermsAt: "2026-06-11T12:00:00Z",
	authorizationContext: {
		globalRole: null,
		partnerAccess: [
			{ role: "rp_admin", workspaceUuid: "workspace-alpha-uuid" },
		],
	},
	departmentAbbreviation: "TBS",
	departmentUuid: "department-uuid",
	email: "local-rp-admin@local.example",
	name: "Local RP Admin",
	profileImageUrl: "",
	termsVersion: "2026-01",
	tierUuid: null,
	uuid: "user-uuid",
	username: "local-rp-admin@local.example",
};

const createDevSessionState = (
	overrides: Partial<DevSessionState> = {}
): DevSessionState => ({
	clearSession: vi.fn(() => Promise.resolve()),
	currentFixture: null,
	devSession,
	error: null,
	isClearing: false,
	isLoading: false,
	isSelecting: false,
	selectFixture: vi.fn(() => Promise.resolve()),
	...overrides,
});

const createSessionState = (
	overrides: Partial<SessionState> = {}
): SessionState => ({
	currentUser: null,
	isAuthenticated: false,
	isLoading: false,
	login: vi.fn(),
	logout: vi.fn(() => Promise.resolve()),
	refreshSession: vi.fn(() => Promise.resolve(user)),
	...overrides,
});

describe("LocalPersonaSelector", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(useDevSession).mockReturnValue(createDevSessionState());
		vi.mocked(useSession).mockReturnValue(createSessionState());
		vi.mocked(getAuthorizationLandingPath).mockReturnValue(
			"/your-applications"
		);
	});

	it("stays absent when the backend route is unavailable", () => {
		vi.mocked(useDevSession).mockReturnValue(
			createDevSessionState({ devSession: null })
		);

		render(<LocalPersonaSelector />);

		expect(
			screen.queryByRole("heading", {
				name: "Try a simulated local persona",
			})
		).toBeNull();
	});

	it("stays absent while availability is loading", () => {
		vi.mocked(useDevSession).mockReturnValue(
			createDevSessionState({ devSession: undefined, isLoading: true })
		);

		render(<LocalPersonaSelector />);
		expect(screen.queryByLabelText("Simulated persona")).toBeNull();
	});

	it("surfaces a GET failure that is not the intentional 404 absence", () => {
		vi.mocked(useDevSession).mockReturnValue(
			createDevSessionState({
				devSession: undefined,
				error: new Error("Failed to confirm local mode"),
			})
		);

		render(<LocalPersonaSelector />);

		expect(
			screen.getByRole("heading", { name: "Unable to load local personas" })
		).toBeTruthy();
		const errorBody = screen.getByText(
			"The backend did not confirm whether local persona simulation is available."
		);
		expect(errorBody.getAttribute("aria-live")).toBe("assertive");
	});

	it("lists all four canonical personas and the no-access persona", () => {
		render(<LocalPersonaSelector />);

		expect(screen.getByText("Local development only")).toBeTruthy();
		expect(screen.getByText("Local CL Admin — CL Admin")).toBeTruthy();
		expect(
			screen.getByText("Local RP Admin — RP Admin in Workspace Alpha")
		).toBeTruthy();
		expect(
			screen.getByText("Local RP User Edit — RP User (Edit) in Workspace Alpha")
		).toBeTruthy();
		expect(
			screen.getByText("Local Read Only — Read Only in Workspace Alpha")
		).toBeTruthy();
		expect(screen.getByText("Local No Access — No access")).toBeTruthy();
		expect(screen.getByText(/cannot submit an arbitrary role/i)).toBeTruthy();
	});

	it("supports keyboard selection, refreshes /user/me, and routes through auth-complete", async () => {
		const browserUser = userEvent.setup();
		const selectFixture = vi.fn(() => Promise.resolve());
		const refreshSession = vi.fn(() => Promise.resolve(user));
		vi.mocked(useDevSession).mockReturnValue(
			createDevSessionState({ selectFixture })
		);
		vi.mocked(useSession).mockReturnValue(
			createSessionState({ refreshSession })
		);
		render(<LocalPersonaSelector />);

		await browserUser.selectOptions(
			screen.getByLabelText("Simulated persona"),
			"local-rp-admin"
		);
		expect(
			screen.getByText("Simulated access: RP Admin in Workspace Alpha")
		).toBeTruthy();

		await browserUser.tab();
		const continueButton = screen.getByRole("button", {
			name: "Continue as simulated user",
		});
		expect(document.activeElement).toBe(continueButton);
		await browserUser.keyboard("{Enter}");

		await waitFor(() => {
			expect(selectFixture).toHaveBeenCalledWith("local-rp-admin");
		});
		expect(refreshSession).toHaveBeenCalledTimes(1);
		expect(getAuthorizationLandingPath).toHaveBeenCalledWith(
			user.authorizationContext
		);
		expect(navigateMock).toHaveBeenCalledWith({
			replace: true,
			search: { redirect: "/your-applications" },
			to: "/auth-complete",
		});
	});

	it("shows a safe rejection when the selected fixture is no longer allowlisted", async () => {
		const browserUser = userEvent.setup();
		vi.mocked(useDevSession).mockReturnValue(
			createDevSessionState({
				selectFixture: vi.fn(() =>
					Promise.reject(new UnknownDevSessionFixtureError())
				),
			})
		);
		render(<LocalPersonaSelector />);

		await browserUser.selectOptions(
			screen.getByLabelText("Simulated persona"),
			"local-cl-admin"
		);
		await browserUser.click(
			screen.getByRole("button", { name: "Continue as simulated user" })
		);

		const errorBody = await screen.findByText(
			"The selected persona is not in the backend allowlist."
		);
		expect(errorBody.getAttribute("aria-live")).toBe("assertive");
		const errorContainer = screen
			.getByRole("heading", {
				name: "Unable to start the simulated session",
			})
			.closest("div");
		expect(document.activeElement).toBe(errorContainer);
		expect(navigateMock).not.toHaveBeenCalled();
	});

	it("shows a localized error when the backend rejects an allowlisted selection", async () => {
		const browserUser = userEvent.setup();
		vi.mocked(useDevSession).mockReturnValue(
			createDevSessionState({
				selectFixture: vi.fn(() =>
					Promise.reject(new Error("Request failed with status 400"))
				),
			})
		);
		render(<LocalPersonaSelector />);

		await browserUser.selectOptions(
			screen.getByLabelText("Simulated persona"),
			"local-rp-admin"
		);
		await browserUser.click(
			screen.getByRole("button", { name: "Continue as simulated user" })
		);

		expect(
			await screen.findByText("The backend did not start the session.")
		).toBeTruthy();
		expect(navigateMock).not.toHaveBeenCalled();
	});

	it("disables the action and announces progress while selection is pending", async () => {
		vi.mocked(useDevSession).mockReturnValue(
			createDevSessionState({
				devSession: { ...devSession, currentFixtureId: "local-read-only" },
				isSelecting: true,
			})
		);
		render(<LocalPersonaSelector />);

		const action = await screen.findByRole("button", {
			name: "Starting simulated session...",
		});
		expect((action as HTMLButtonElement).disabled).toBe(true);
	});
});
