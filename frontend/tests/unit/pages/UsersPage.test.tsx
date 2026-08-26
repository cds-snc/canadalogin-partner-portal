import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedRequestError } from "@/fetch";
import { UsersPage } from "@/features/users/pages/UsersPage";
import { usePendingUserInvitations, useUserManagement } from "@/hooks";

const adminListState = vi.hoisted(() => ({
	page: 1,
	searchDraft: "",
	setPage: vi.fn(),
	setSearchDraft: vi.fn(),
}));
const navigate = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigate,
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { resolvedLanguage: "en" },
		t: (key: string): string =>
			({
				"authorization.roles.clAdmin": "CL Admin",
				"authorization.roles.readOnly": "Read Only",
				"users.accountStatusActive": "Active",
				"users.accountStatusDisabled": "Disabled",
				"users.accountStatusLabel": "Account status",
				"users.emailLabel": "Email",
				"users.globalAccessLabel": "Global access",
				"users.invitationExpiresLabel": "Expires",
				"users.invitationItemLabel": "pending invitations",
				"users.invitationStatusLabel": "Status",
				"users.inviteWorkspaceLabel": "Workspace",
				"users.inviteAction": "Invite user",
				"users.manageAction": "Manage",
				"users.nameLabel": "Name",
				"users.noCanonicalGlobalRoleShort": "None",
				"users.noPendingInvitations": "No pending invitations.",
				"users.noWorkspaceAccess": "None",
				"users.pendingInvitationsSummary":
					"People listed here have not accepted access yet.",
				"users.pendingInvitationsErrorBody":
					"The pending invitations list could not be loaded.",
				"users.pendingInvitationsErrorTitle":
					"Unable to load pending invitations",
				"users.pendingInvitationsTitle": "Pending invitations",
				"users.pendingInvitationStatus": "Pending",
				"users.requestedRoleLabel": "Requested role",
				"users.searchEmptyBody": "No users matched the directory search.",
				"users.searchLabel": "Search users",
				"users.summary": "Review users and their canonical access.",
				"users.title": "Users and access",
				"users.workspaceAccessLabel": "Workspace access",
			})[key] ?? key,
	}),
}));

vi.mock("@/components/ui", () => ({
	DataTable: ({
		action,
		columns,
		emptyMessage,
		onSearchChange,
		primaryAction,
		rows,
		searchLabel,
		searchQuery,
		title,
	}: {
		action?: Array<{
			buttonLabel: string;
			href?: (row: Record<string, string>) => string;
			onAction?: (row: Record<string, string>) => void;
			screenReaderLabel?: (row: Record<string, string>) => string;
		}>;
		columns: Array<{ field: string; headerName: string }>;
		emptyMessage?: string;
		onSearchChange?: (query: string) => void;
		primaryAction?: { buttonLabel: string; onAction: () => void };
		rows: Array<Record<string, string>>;
		searchLabel?: string;
		searchQuery?: string;
		title: string;
	}): ReactElement => (
		<section>
			<h2>{title}</h2>
			{columns.map((column) => (
				<span key={column.field}>{column.headerName}</span>
			))}
			{searchLabel && onSearchChange ? (
				<label>
					{searchLabel}
					<input
						type="search"
						value={searchQuery}
						onInput={(event) => {
							onSearchChange((event.target as HTMLInputElement).value);
						}}
					/>
				</label>
			) : null}
			{rows.length === 0 && emptyMessage ? <p>{emptyMessage}</p> : null}
			{primaryAction ? (
				<button type="button" onClick={primaryAction.onAction}>
					{primaryAction.buttonLabel}
				</button>
			) : null}
			{rows.map((row) => (
				<div key={row["uuid"] ?? row["invitationUuid"]}>
					{columns.map((column) => (
						<span key={column.field}>{row[column.field]}</span>
					))}
					{action?.map((item) =>
						item.href ? (
							<a key={item.buttonLabel} href={item.href(row)}>
								{item.buttonLabel}{" "}
								<span className="sr-only">{item.screenReaderLabel?.(row)}</span>
							</a>
						) : (
							<button
								key={item.buttonLabel}
								type="button"
								onClick={() => item.onAction?.(row)}
							>
								{item.buttonLabel}{" "}
								<span className="sr-only">{item.screenReaderLabel?.(row)}</span>
							</button>
						)
					)}
				</div>
			))}
		</section>
	),
	Heading: ({
		children,
		tag = "h1",
	}: PropsWithChildren<{ tag?: "h1" | "h2" }>): ReactElement => {
		const Component = tag;
		return <Component>{children}</Component>;
	},
	Notice: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
	),
	Pagination: (): null => null,
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/hooks", () => ({
	useAdminListState: () => adminListState,
	usePendingUserInvitations: vi.fn(),
	useUserManagement: vi.fn(),
}));

const sampleUser = {
	email: "jane@example.com",
	enabled: true,
	globalRole: "cl_admin" as const,
	name: "Jane Doe",
	uuid: "user-uuid-7",
	workspaceAssignments: [
		{
			role: "read_only" as const,
			workspaceName: "Benefits",
			workspaceUuid: "workspace-uuid-1",
		},
	],
};

const sampleInvitation = {
	createdAt: "2026-08-12T12:00:00Z",
	invitationUuid: "invitation-uuid-1",
	inviteExpiresAt: "2026-08-20T12:00:00Z",
	invitedEmail: "invited@example.com",
	role: "read_only" as const,
	status: "pending" as const,
	workspaceName: "Benefits",
	workspaceUuid: "workspace-uuid-1",
};

const setUsers = (
	users: Array<typeof sampleUser>,
	error: Error | null = null
): void => {
	vi.mocked(useUserManagement).mockReturnValue({
		error,
		isLoading: false,
		response: error
			? null
			: {
					data: users,
					has_more: false,
					items_per_page: 10,
					page: 1,
					total_count: users.length,
				},
		users,
	} as never);
};

describe("UsersPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		adminListState.page = 1;
		adminListState.searchDraft = "";
		vi.mocked(usePendingUserInvitations).mockReturnValue({
			error: null,
			invitations: [],
			isLoading: false,
			response: {
				data: [],
				has_more: false,
				items_per_page: 10,
				page: 1,
				total_count: 0,
			},
		} as never);
	});

	it("shows access instead of provider metadata and uses concise actions", () => {
		setUsers([sampleUser]);

		render(<UsersPage />);

		expect(
			screen.getByRole("heading", { name: "Users and access", level: 1 })
		).toBeTruthy();
		expect(screen.getByText("Global access")).toBeTruthy();
		expect(screen.getByText("Workspace access")).toBeTruthy();
		expect(screen.getByText("CL Admin")).toBeTruthy();
		expect(screen.getByText("Benefits — Read Only")).toBeTruthy();
		expect(screen.queryByText(/auth provider/i)).toBeNull();
		expect(screen.getByRole("button", { name: "Invite user" })).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "Manage jane@example.com" })
		).toBeTruthy();
	});

	it("routes invite and manage actions to their dedicated workflows", () => {
		setUsers([sampleUser]);
		render(<UsersPage />);

		fireEvent.click(screen.getByRole("button", { name: "Invite user" }));
		fireEvent.click(
			screen.getByRole("button", { name: "Manage jane@example.com" })
		);

		expect(navigate).toHaveBeenNthCalledWith(1, { to: "/users/invite" });
		expect(navigate).toHaveBeenNthCalledWith(2, {
			params: { userUuid: sampleUser.uuid },
			to: "/users/$userUuid",
		});
	});

	it("shows pending invitees separately and routes management to workspace access", () => {
		setUsers([sampleUser]);
		vi.mocked(usePendingUserInvitations).mockReturnValue({
			error: null,
			invitations: [sampleInvitation],
			isLoading: false,
			response: {
				data: [sampleInvitation],
				has_more: false,
				items_per_page: 10,
				page: 1,
				total_count: 1,
			},
		} as never);

		render(<UsersPage />);

		expect(
			screen.getAllByRole("heading", {
				name: "Pending invitations",
				level: 2,
			})
		).toHaveLength(2);
		expect(screen.getAllByText("invited@example.com")).toHaveLength(2);
		expect(screen.getByText("Pending")).toBeTruthy();
		expect(
			screen
				.getByRole("link", { name: "Manage invited@example.com" })
				.getAttribute("href")
		).toBe("/workspaces/workspace-uuid-1/access/invitations/invitation-uuid-1");
	});

	it("keeps invitations in one workspace on distinct record destinations", () => {
		setUsers([sampleUser]);
		const secondInvitation = {
			...sampleInvitation,
			invitationUuid: "invitation-uuid-2",
			invitedEmail: "other@example.com",
		};
		vi.mocked(usePendingUserInvitations).mockReturnValue({
			error: null,
			invitations: [sampleInvitation, secondInvitation],
			isLoading: false,
			response: {
				data: [sampleInvitation, secondInvitation],
				has_more: false,
				items_per_page: 10,
				page: 1,
				total_count: 2,
			},
		} as never);

		render(<UsersPage />);

		expect(
			screen
				.getByRole("link", { name: "Manage invited@example.com" })
				.getAttribute("href")
		).toContain("invitation-uuid-1");
		expect(
			screen
				.getByRole("link", { name: "Manage other@example.com" })
				.getAttribute("href")
		).toContain("invitation-uuid-2");
	});

	it("states when there are no pending invitations", () => {
		setUsers([sampleUser]);
		render(<UsersPage />);

		expect(screen.getByText("No pending invitations.")).toBeTruthy();
	});

	it("keeps the invite task available when no accepted users exist", () => {
		setUsers([]);
		render(<UsersPage />);

		expect(screen.getByRole("button", { name: "Invite user" })).toBeTruthy();
	});

	it("shows a safe section error when pending invitations cannot load", () => {
		setUsers([sampleUser]);
		vi.mocked(usePendingUserInvitations).mockReturnValue({
			error: new Error("database details must not render"),
			invitations: [],
			isLoading: false,
			response: null,
		} as never);

		render(<UsersPage />);

		expect(
			screen.getByText("The pending invitations list could not be loaded.")
		).toBeTruthy();
		expect(screen.queryByText(/database details/i)).toBeNull();
	});

	it("keeps server-backed directory search visible when no users match", () => {
		adminListState.searchDraft = "missing person";
		setUsers([]);
		render(<UsersPage />);

		const search = screen.getByRole("searchbox", { name: "Search users" });
		expect((search as HTMLInputElement).value).toBe("missing person");
		expect(
			screen.getByText("No users matched the directory search.")
		).toBeTruthy();
	});

	it("does not render a duplicate notice for an unauthorized list response", () => {
		setUsers([], new UnauthorizedRequestError());
		render(<UsersPage />);

		expect(screen.queryByText("users.errorTitle")).toBeNull();
	});
});
