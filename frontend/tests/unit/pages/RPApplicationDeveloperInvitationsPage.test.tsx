import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RPApplicationDeveloperInvitationsPage } from "@/features/workspaces/pages/RPApplicationDeveloperInvitationsPage";
import { useSession } from "@/features/auth/hooks/use-session";

const mockNavigate = vi.fn();
const {
	mockedInviteRPApplicationDeveloper,
	mockedUseQuery,
} = vi.hoisted(() => ({
	mockedInviteRPApplicationDeveloper: vi.fn(async () => ({
		invited_email: "developer@example.com",
	})),
	mockedUseQuery: vi.fn(),
}));

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		i18n: { language: string };
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		i18n: { language: "en" },
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"common.cancel": "Cancel",
				"common.save": "Save",
				"errors.unknown": "Unknown error",
				"nav.home": "Home",
				"workspaces.applicationNameLabel": "Application name",
				"workspaces.backToApplication": "Back to Application",
				"workspaces.department": "Department",
				"workspaces.developerInvitationsSummary": "Developer invitations summary",
				"workspaces.developerInvitationsTitle": `Developer invitations - ${options?.["name"] ?? ""}`,
				"workspaces.developerInvitationExpiresAt": "Expires",
				"workspaces.developerInvitationSentAt": "Sent",
				"workspaces.developerInvitationStatus": "Status",
				"workspaces.developerInvitationStatusAccepted": "Accepted",
				"workspaces.developerInvitationStatusExpired": "Expired",
				"workspaces.developerInvitationStatusPending": "Pending",
				"workspaces.developerInvitationStatusRevoked": "Revoked",
				"workspaces.inviteDeveloper": "Invite developer",
				"workspaces.inviteDeveloperBody": "Invite body",
				"workspaces.inviteDeveloperEmailLabel": "Developer email",
				"workspaces.inviteDeveloperModalTitle": "Invite RP application developer",
				"workspaces.inviteDeveloperSuccess": "Developer invitation sent.",
				"workspaces.loadingDeveloperInvitations": "Loading invitations",
				"workspaces.manageDeveloperInvitations": "Manage developer invitations",
				"workspaces.reactivateDeveloperInvitation": "Reactivate invitation",
				"workspaces.reactivateDeveloperInvitationSuccess": "Invitation reactivated",
				"workspaces.resendDeveloperInvitation": "Resend invitation",
				"workspaces.resendDeveloperInvitationSuccess": "Invitation resent",
				"workspaces.revokeDeveloperInvitation": "Revoke invitation",
				"workspaces.revokeDeveloperInvitationConfirmBody": `Revoke ${options?.["email"] ?? ""}`,
				"workspaces.revokeDeveloperInvitationConfirmTitle": "Revoke invitation",
				"workspaces.revokeDeveloperInvitationSuccess": "Invitation revoked",
				"workspaces.title": "Workspaces",
				"workspaces.workspaceName": "Workspace name",
			};

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-query", () => ({
	useQuery: mockedUseQuery,
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: vi.fn(() => mockNavigate),
	useParams: vi.fn(() => ({
		rpApplicationUuid: "application-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	})),
}));

vi.mock("@/components/layout", () => ({
	Breadcrumbs: (): ReactElement => <nav>Breadcrumbs</nav>,
	CenteredPageLayout: ({ children }: PropsWithChildren): ReactElement => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, onGcdsClick }: PropsWithChildren<{ onGcdsClick?: () => void }>): ReactElement => (
		<button type="button" onClick={onGcdsClick}>
			{children}
		</button>
	),
	ConfirmDialog: ({
		confirmLabel,
		description,
		isOpen,
		title,
		onConfirm,
	}: {
		confirmLabel: string;
		description: string;
		isOpen: boolean;
		title: string;
		onConfirm: () => void;
	}): ReactElement | null =>
		isOpen ? (
			<section>
				<h2>{title}</h2>
				<p>{description}</p>
				<button type="button" onClick={onConfirm}>
					{confirmLabel}
				</button>
			</section>
		) : null,
	DataTable: ({
		action,
		primaryAction,
		rows,
		title,
	}: {
		action?:
			| {
					buttonLabel: string;
					isVisible?: (row: Record<string, unknown>) => boolean;
					onAction: (row: Record<string, unknown>) => void;
				}
			| Array<{
					buttonLabel: string;
					isVisible?: (row: Record<string, unknown>) => boolean;
					onAction: (row: Record<string, unknown>) => void;
				}>;
		primaryAction?: { buttonLabel: string; onAction: () => void };
		rows: Array<Record<string, unknown>>;
		title: string;
	}): ReactElement => {
		const actions = Array.isArray(action) ? action : action ? [action] : [];

		return (
			<section>
				<h2>{title}</h2>
				{primaryAction ? (
					<button type="button" onClick={primaryAction.onAction}>
						{primaryAction.buttonLabel}
					</button>
				) : null}
				{rows.map((row) => (
					<div key={String(row["uuid"])}>
						<span>{String(row["invitedEmail"])}</span>
						<span>{String(row["status"])}</span>
						{actions
							.filter((a) => !a.isVisible || a.isVisible(row))
							.map((a) => (
								<button
									key={`${String(row["uuid"])}-${a.buttonLabel}`}
									type="button"
									onClick={() => {
										a.onAction(row);
									}}
								>
									{a.buttonLabel}
								</button>
							))}
					</div>
				))}
			</section>
		);
	},
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Input: ({ label, onInput, value }: { label: string; onInput?: (event: { target: { value: string } }) => void; value?: string }): ReactElement => (
		<label>
			<span>{label}</span>
			<input
				aria-label={label}
				value={value ?? ""}
				onInput={(event) => {
					onInput?.({
						target: { value: (event.target as HTMLInputElement).value },
					});
				}}
			/>
		</label>
	),
	Modal: ({ children, footer, isOpen, title }: PropsWithChildren<{ footer?: ReactElement; isOpen: boolean; title: string }>): ReactElement | null =>
		isOpen ? (
			<section>
				<h2>{title}</h2>
				{children}
				{footer}
			</section>
		) : null,
	Notice: ({ children }: PropsWithChildren): ReactElement => <section>{children}</section>,
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/components/ui/Toast", () => ({
	useToast: () => ({
		error: vi.fn(),
		success: vi.fn(),
	}),
}));

vi.mock("@/fetch/workspaces", () => ({
	getCurrentUserWorkspaces: vi.fn(async () => []),
	getRPApplicationDeveloperInvitations: vi.fn(async () => []),
	getRPApplications: vi.fn(async () => []),
	getWorkspaceMembers: vi.fn(async () => []),
	inviteRPApplicationDeveloper: mockedInviteRPApplicationDeveloper,
	resendRPApplicationDeveloperInvitation: vi.fn(async () => undefined),
	revokeRPApplicationDeveloperInvitation: vi.fn(async () => undefined),
}));

vi.mock("@/fetch/departments", () => ({
	getDepartmentById: vi.fn(async () => null),
}));

vi.mock("@/features/auth/hooks/use-session", () => ({
	useSession: vi.fn(),
}));

const mockedUseSession = vi.mocked(useSession);

describe("RPApplicationDeveloperInvitationsPage", () => {
	it("renders invitations and supports opening invite modal", () => {
		mockedUseQuery.mockImplementation(
			({ queryKey }: { queryKey: Array<string> }) => {
				if (queryKey[0] === "workspace") {
					return {
						data: {
							departmentId: 7,
							name: "Health Workspace",
							uuid: "workspace-uuid-1",
						},
						isError: false,
						isLoading: false,
					};
				}

				if (queryKey[0] === "workspace-applications") {
					return {
						data: [
							{
								name: "Benefits Portal",
								uuid: "application-uuid-1",
							},
						],
						isError: false,
						isLoading: false,
					};
				}

				if (queryKey[0] === "workspace-members") {
					return {
						data: [{ role: "workspace_admin", userUuid: "user-uuid-1" }],
						isError: false,
						isLoading: false,
					};
				}

				if (queryKey[0] === "rp-application-developer-invitations") {
					return {
						data: [
							{
								createdAt: "2026-04-20T00:00:00Z",
								invitedEmail: "developer@example.com",
								inviteExpiresAt: "2026-04-27T00:00:00Z",
								status: "pending",
								uuid: "invitation-uuid-1",
							},
						],
						isError: false,
						isLoading: false,
						refetch: vi.fn(async () => undefined),
					};
				}

				return {
					data: null,
					isError: false,
					isLoading: false,
				};
			}
		);

		mockedUseSession.mockReturnValue({
			currentUser: {
				uuid: "user-uuid-1",
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		} as never);

		render(<RPApplicationDeveloperInvitationsPage />);

		expect(screen.getByRole("heading", { name: /developer invitations - benefits portal/i })).toBeTruthy();
		expect(screen.getByText(/developer@example.com/i)).toBeTruthy();
		expect(
			screen.getAllByRole("button", { name: /invite developer/i }).length
		).toBeGreaterThan(0);
		const inviteButtons = screen.getAllByRole("button", {
			name: /invite developer/i,
		});

		fireEvent.click(inviteButtons[0]!);
		expect(
			screen.getByRole("heading", { name: /invite rp application developer/i })
		).toBeTruthy();
	});

	it("submits a new invitation from the management page", () => {
		mockedUseQuery.mockImplementation(
			({ queryKey }: { queryKey: Array<string> }) => {
				if (queryKey[0] === "workspace") {
					return {
						data: {
							departmentId: 7,
							name: "Health Workspace",
							uuid: "workspace-uuid-1",
						},
						isError: false,
						isLoading: false,
					};
				}

				if (queryKey[0] === "workspace-applications") {
					return {
						data: [
							{
								name: "Benefits Portal",
								uuid: "application-uuid-1",
							},
						],
						isError: false,
						isLoading: false,
					};
				}

				if (queryKey[0] === "workspace-members") {
					return {
						data: [{ role: "workspace_admin", userUuid: "user-uuid-1" }],
						isError: false,
						isLoading: false,
					};
				}

				if (queryKey[0] === "rp-application-developer-invitations") {
					return {
						data: [],
						isError: false,
						isLoading: false,
						refetch: vi.fn(async () => undefined),
					};
				}

				return {
					data: null,
					isError: false,
					isLoading: false,
				};
			}
		);

		mockedUseSession.mockReturnValue({
			currentUser: {
				uuid: "user-uuid-1",
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		} as never);

		render(<RPApplicationDeveloperInvitationsPage />);

		fireEvent.click(screen.getByRole("button", { name: /invite developer/i }));
		fireEvent.input(screen.getByLabelText(/developer email/i), {
			target: { value: "developer@example.com" },
		});
		fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

		expect(mockedInviteRPApplicationDeveloper).toHaveBeenCalledWith(
			"workspace-uuid-1",
			"application-uuid-1",
			"developer@example.com"
		);
	});
});
