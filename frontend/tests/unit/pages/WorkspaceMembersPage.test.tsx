import type { PropsWithChildren, ReactElement } from "react";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceMembersPage } from "@/features/workspaces/pages/WorkspaceMembersPage";
import { useWorkspaceAccessInvitations } from "@/features/workspaces/hooks/use-workspace-access-invitations";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";
import { useWorkspaceRoleAssignments } from "@/features/workspaces/hooks/use-workspace-role-assignments";
import { useWorkspaceRPApplications } from "@/features/workspaces/hooks/use-workspace-rp-applications";
import { useSession } from "@/hooks";

const assignment = {
	assignedAt: "2026-08-11T18:00:00Z",
	assignmentUuid: "assignment-uuid-1",
	role: "read_only" as const,
	userEmail: "reader@example.test",
	userName: "Local Reader",
	userUuid: "reader-uuid-1",
	workspaceUuid: "workspace-uuid-1",
};

const assignMock = vi.fn(() => Promise.resolve(assignment));
const replaceMock = vi.fn(() => Promise.resolve(assignment));
const revokeMock = vi.fn(() => Promise.resolve());
const searchMock = vi.fn(() =>
	Promise.resolve([
		{
			email: "candidate@example.test",
			name: "Candidate User",
			uuid: "candidate-uuid-1",
		},
	])
);
const routerState = vi.hoisted(() => ({ workspaceUuid: "workspace-uuid-1" }));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>): string =>
			key === "authorization.activeWorkspaceNameContext"
				? `Active role: ${String(options?.["role"])} for ${String(options?.["workspaceName"])}.`
				: key === "workspaces.accessPageTitle"
					? `Access — ${String(options?.["name"])}`
					: key === "workspaces.accessInvitationRevokeConfirmBody"
						? `Revoke the invitation for ${String(options?.["email"])}?`
						: key === "workspaces.accessInvitationReissueConfirmBody"
							? `Reissue the invitation for ${String(options?.["email"])}?`
							: key === "workspaces.revokeRoleConfirmBody"
								? `Remove access from ${String(options?.["name"])}.`
								: ({
										"authorization.roles.clAdmin": "CL Admin",
										"authorization.roles.readOnly": "Read Only",
										"authorization.roles.rpAdmin": "RP Admin",
										"authorization.roles.rpUserEdit": "RP User (Edit)",
										"common.cancel": "Cancel",
										"common.search": "Search",
										"common.searching": "Searching...",
										"workspaces.assignRoleAction": "Assign role",
										"workspaces.assignRoleForUser": `Assign role to ${String(options?.["name"] ?? "")}`,
										"workspaces.assigningRoleAction": "Assigning role...",
										"workspaces.currentAssignments": "Current role assignments",
										"workspaces.manageMembers": "Manage roles",
										"workspaces.memberEmail": "Email",
										"workspaces.memberName": "Name",
										"workspaces.memberRole": "Role",
										"workspaces.memberRoleForUser": `Role for ${String(options?.["name"] ?? "")}`,
										"workspaces.membersSearchSummary": "Search eligible users.",
										"workspaces.rpAdminMembersSearchSummary":
											"Enter an exact email address.",
										"workspaces.membersSummary":
											"Manage canonical workspace roles.",
										"workspaces.accessSummary": "Manage workspace access.",
										"workspaces.accessInvitationCreateAction":
											"Choose an RP application to create an invitation",
										"workspaces.accessInvitationManageApplication":
											"Manage invitation in RP application",
										"workspaces.accessInvitationRevokeConfirmTitle":
											"Revoke invitation?",
										"workspaces.accessInvitationReissueAction":
											"Reissue invitation",
										"workspaces.accessInvitationReissueConfirmTitle":
											"Reissue invitation?",
										"workspaces.accessInvitationsEmptyBody":
											"Create the first invitation.",
										"workspaces.accessInvitationsEmptyTitle":
											"No workspace invitations",
										"workspaces.accessInvitationsSummary":
											"Review invitation status.",
										"workspaces.accessInvitationsTitle":
											"Workspace invitations",
										"workspaces.applicationsInvitationEmailLabel": "Email",
										"workspaces.applicationsInvitationExpiresAtDisplayLabel":
											"Expires",
										"workspaces.applicationsInvitationRevokeAction":
											"Revoke invitation",
										"workspaces.applicationsInvitationRevokingAction":
											"Revoking invitation...",
										"workspaces.applicationsInvitationRoleLabel":
											"Invitation role",
										"workspaces.applicationsInvitationStatusLabel": "Status",
										"workspaces.applicationsInvitationStatusPending": "Pending",
										"workspaces.navigation.access": "Access",
										"workspaces.workspaceLabel": "Workspace",
										"workspaces.noSearchResults": "No users found.",
										"workspaces.rpAdminNoSearchResults":
											"No eligible user matched that exact email address.",
										"workspaces.rpAdminSearchUsersEmailError":
											"Enter a complete email address.",
										"workspaces.rpAdminSearchUsersHint":
											"Partial names and email addresses are not searched.",
										"workspaces.revokeRoleAction": "Revoke role",
										"workspaces.revokeRoleConfirmTitle":
											"Revoke workspace role?",
										"workspaces.revokingRoleAction": "Revoking role...",
										"workspaces.roleAssignedSuccess":
											"Workspace role assigned successfully",
										"workspaces.roleReplacedSuccess":
											"Workspace role replaced successfully",
										"workspaces.roleRevokedSuccess":
											"Workspace role revoked successfully",
										"workspaces.roleMutationError":
											"The workspace role change could not be completed.",
										"workspaces.saveRoleAction": "Save role",
										"workspaces.searchResults": "Search results",
										"workspaces.searchUserByEmail":
											"Find eligible user by email",
										"workspaces.searchUsers": "Search users",
										"workspaces.searchUsersHint": "Search by name or email.",
										"workspaces.searchUsersLengthError":
											"Enter between 2 and 100 characters.",
										"workspaces.selectRole": "Select role",
									}[key] ?? key),
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useParams: () => ({ workspaceUuid: routerState.workspaceUuid }),
}));

vi.mock("@/hooks", () => ({ useSession: vi.fn() }));
vi.mock("@/features/workspaces/hooks/use-workspace", () => ({
	useWorkspace: vi.fn(),
}));
vi.mock("@/features/workspaces/hooks/use-workspace-role-assignments", () => ({
	useWorkspaceRoleAssignments: vi.fn(),
}));
vi.mock("@/features/workspaces/hooks/use-workspace-rp-applications", () => ({
	useWorkspaceRPApplications: vi.fn(),
}));
vi.mock("@/features/workspaces/hooks/use-workspace-access-invitations", () => ({
	useWorkspaceAccessInvitations: vi.fn(),
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
		<button disabled={disabled} onClick={onGcdsClick} type="button">
			{children}
		</button>
	),
	ConfirmDialog: ({
		confirmLabel,
		description,
		errorMessage,
		isOpen,
		onConfirm,
		title,
	}: {
		confirmLabel: string;
		description: string;
		errorMessage?: string | null;
		isOpen: boolean;
		onConfirm: () => void;
		title: string;
	}): ReactElement | null =>
		isOpen ? (
			<section>
				<h2>{title}</h2>
				<p>{description}</p>
				{errorMessage ? <p role="alert">{errorMessage}</p> : null}
				<button onClick={onConfirm} type="button">
					{confirmLabel}
				</button>
			</section>
		) : null,
	DataTable: ({
		action,
		columns,
		rows,
	}: {
		action: Array<{
			buttonLabel: string;
			isVisible?: (row: (typeof rows)[number]) => boolean;
			onAction: (row: (typeof rows)[number]) => void;
		}>;
		columns: Array<{
			cellRenderer?: (row: (typeof rows)[number]) => ReactElement;
			headerName: string;
		}>;
		rows: Array<{
			assignmentUuid: string;
			role: string;
			userEmail: string;
			userName: string;
			userUuid: string;
		}>;
	}): ReactElement => (
		<section>
			{rows.map((row) => (
				<div key={row.assignmentUuid}>
					<span>{row.userName}</span>
					{columns.map((column) =>
						column.cellRenderer ? (
							<div key={column.headerName}>{column.cellRenderer(row)}</div>
						) : null
					)}
					{action
						.filter((item) => item.isVisible?.(row) ?? true)
						.map((item) => (
							<button
								key={item.buttonLabel}
								onClick={() => item.onAction(row)}
								type="button"
							>
								{item.buttonLabel}
							</button>
						))}
				</div>
			))}
		</section>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => (
		<h2>{children}</h2>
	),
	Link: ({
		children,
		href,
	}: PropsWithChildren<{ href: string }>): ReactElement => (
		<a href={href}>{children}</a>
	),
	Input: ({
		errorMessage,
		hint,
		inputId,
		label,
		onInput,
		type,
	}: {
		errorMessage?: string;
		hint?: string;
		inputId: string;
		label: string;
		onInput: (event: { target: { value: string } }) => void;
		type?: "email" | "search";
	}): ReactElement => (
		<div>
			<label htmlFor={inputId}>
				{label}
				<input
					id={inputId}
					type={type}
					onInput={(event) =>
						onInput({
							target: { value: (event.target as HTMLInputElement).value },
						})
					}
				/>
			</label>
			{hint ? <p>{hint}</p> : null}
			{errorMessage ? <p role="alert">{errorMessage}</p> : null}
		</div>
	),
	Notice: ({
		children,
		noticeTitle,
	}: PropsWithChildren<{ noticeTitle: string }>) => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Select: ({
		children,
		label,
		onInput,
		selectId,
		value,
	}: PropsWithChildren<{
		label: string;
		onInput: (event: { target: { value: string } }) => void;
		selectId: string;
		value: string;
	}>): ReactElement => (
		<label htmlFor={selectId}>
			{label}
			<select
				id={selectId}
				value={value}
				onInput={(event) =>
					onInput({
						target: { value: (event.target as HTMLSelectElement).value },
					})
				}
			>
				{children}
			</select>
		</label>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

const setState = (globalRole: "cl_admin" | null): void => {
	vi.mocked(useSession).mockReturnValue({
		currentUser: {
			acceptedTermsAt: null,
			authorizationContext: globalRole
				? { globalRole, partnerAccess: [] }
				: {
						globalRole: null,
						partnerAccess: [
							{ role: "rp_admin", workspaceUuid: "workspace-uuid-1" },
						],
					},
			departmentAbbreviation: null,
			departmentUuid: null,
			email: "actor@example.test",
			name: "Actor",
			profileImageUrl: "",
			termsVersion: null,
			tierUuid: null,
			uuid: "actor-uuid-1",
			username: "actor@example.test",
		},
		isAuthenticated: true,
		isLoading: false,
		login: vi.fn(),
		logout: vi.fn(async () => undefined),
		refreshSession: vi.fn(async () => null),
	});
	vi.mocked(useWorkspace).mockReturnValue({
		error: null,
		isLoading: false,
		refetch: vi.fn(),
		workspace: {
			name: routerState.workspaceUuid === "workspace-uuid-1" ? "Alpha" : "Beta",
			uuid: routerState.workspaceUuid,
		},
	} as never);
	vi.mocked(useWorkspaceRoleAssignments).mockReturnValue({
		assign: assignMock,
		assignments: [assignment],
		error: null,
		isAssigning: false,
		isLoading: false,
		isReplacing: false,
		isRevoking: false,
		isSearching: false,
		replace: replaceMock,
		revoke: revokeMock,
		searchCandidates: searchMock,
	});
	vi.mocked(useWorkspaceRPApplications).mockReturnValue({
		applications: [],
		error: null,
		isLoading: false,
		refetch: vi.fn(),
	});
	vi.mocked(useWorkspaceAccessInvitations).mockReturnValue({
		createInvitation: vi.fn(),
		error: null,
		invitations: [],
		isCreating: false,
		isLoading: false,
		isReissuing: false,
		isRevoking: false,
		refetch: vi.fn(),
		reissueInvitation: vi.fn(),
		revokeInvitation: vi.fn(),
	});
};

describe("WorkspaceMembersPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		routerState.workspaceUuid = "workspace-uuid-1";
	});

	it("lets an RP Admin assign, replace, and revoke only lower roles", async () => {
		setState(null);
		render(<WorkspaceMembersPage />);

		expect(screen.queryByRole("option", { name: "RP Admin" })).toBeNull();
		const candidateSearch = screen.getByLabelText(
			"Find eligible user by email"
		);
		expect((candidateSearch as HTMLInputElement).type).toBe("email");
		expect(
			screen.getByText("Partial names and email addresses are not searched.")
		).toBeTruthy();
		fireEvent.input(candidateSearch, {
			target: { value: "candidate" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Search" }));
		expect(screen.getByRole("alert").textContent).toContain(
			"Enter a complete email address."
		);
		expect(searchMock).not.toHaveBeenCalled();

		fireEvent.input(candidateSearch, {
			target: { value: "candidate@example.test" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Search" }));
		await waitFor(() =>
			expect(searchMock).toHaveBeenCalledWith("candidate@example.test")
		);

		fireEvent.input(screen.getAllByLabelText("Select role")[0]!, {
			target: { value: "rp_user_edit" },
		});
		fireEvent.click(
			screen.getByRole("button", { name: "Assign role Candidate User" })
		);
		await waitFor(() =>
			expect(assignMock).toHaveBeenCalledWith({
				role: "rp_user_edit",
				userUuid: "candidate-uuid-1",
			})
		);

		fireEvent.input(screen.getByLabelText("Role for Local Reader"), {
			target: { value: "rp_user_edit" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Save role" }));
		await waitFor(() =>
			expect(replaceMock).toHaveBeenCalledWith("reader-uuid-1", "rp_user_edit")
		);

		fireEvent.click(screen.getByRole("button", { name: "Revoke role" }));
		fireEvent.click(screen.getAllByRole("button", { name: "Revoke role" })[1]!);
		await waitFor(() =>
			expect(revokeMock).toHaveBeenCalledWith("reader-uuid-1")
		);
	});

	it("lets a CL Admin select RP Admin and retain broad directory search", async () => {
		setState("cl_admin");
		render(<WorkspaceMembersPage />);

		expect(
			screen.getAllByRole("option", { name: "RP Admin" }).length
		).toBeGreaterThan(0);
		expect(screen.getByText(/Active role: CL Admin/)).toBeTruthy();
		const candidateSearch = screen.getByLabelText("Search users");
		expect((candidateSearch as HTMLInputElement).type).toBe("search");
		fireEvent.input(candidateSearch, {
			target: { value: "Candidate User" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Search" }));
		await waitFor(() =>
			expect(searchMock).toHaveBeenCalledWith("Candidate User")
		);
	});

	it("shows canonical invitations across RP applications and confirms revocation", async () => {
		setState(null);
		const revokeInvitation = vi.fn(() => Promise.resolve({} as never));
		const reissueInvitation = vi.fn(() =>
			Promise.resolve({
				acceptanceUrl: "http://localhost:3000/invitations/new-token",
			} as never)
		);
		vi.mocked(useWorkspaceRPApplications).mockReturnValue({
			applications: [
				{
					dnr_app_name: "Benefits Portal",
					uuid: "rp-application-uuid-1",
				} as never,
			],
			error: null,
			isLoading: false,
			refetch: vi.fn(),
		});
		vi.mocked(useWorkspaceAccessInvitations).mockReturnValue({
			createInvitation: vi.fn(),
			error: null,
			invitations: [
				{
					createdAt: "2026-08-11T18:00:00Z",
					inviteExpiresAt: "2026-09-01T00:00:00Z",
					invitedEmail: "invitee@example.test",
					role: "read_only",
					status: "pending",
					uuid: "invitation-uuid-1",
				} as never,
			],
			isCreating: false,
			isLoading: false,
			isReissuing: false,
			isRevoking: false,
			refetch: vi.fn(),
			reissueInvitation,
			revokeInvitation,
		});

		render(<WorkspaceMembersPage />);

		expect(
			screen.getByRole("heading", { name: "invitee@example.test" })
		).toBeTruthy();
		fireEvent.click(
			screen.getByRole("button", {
				name: "Revoke invitation invitee@example.test",
			})
		);
		fireEvent.click(screen.getByRole("button", { name: "Revoke invitation" }));

		await waitFor(() =>
			expect(revokeInvitation).toHaveBeenCalledWith("invitation-uuid-1")
		);

		fireEvent.click(screen.getByRole("button", { name: /Reissue invitation/ }));
		fireEvent.click(screen.getByRole("button", { name: "Reissue invitation" }));
		await waitFor(() =>
			expect(reissueInvitation).toHaveBeenCalledWith(
				"invitation-uuid-1",
				expect.objectContaining({ inviteExpiresAt: expect.any(String) })
			)
		);
	});

	it("keeps revoke failures inside the open confirmation dialog", async () => {
		setState(null);
		revokeMock.mockRejectedValueOnce(new Error("revoke failed"));
		render(<WorkspaceMembersPage />);

		fireEvent.click(screen.getByRole("button", { name: "Revoke role" }));
		fireEvent.click(screen.getAllByRole("button", { name: "Revoke role" })[1]!);

		expect((await screen.findByRole("alert")).textContent).toContain(
			"The workspace role change could not be completed."
		);
		expect(
			screen.getByRole("heading", { name: "Revoke workspace role?" })
		).toBeTruthy();
	});

	it("clears workspace state and ignores stale search results when the route changes", async () => {
		setState(null);
		let resolveSearch: (
			value: Awaited<ReturnType<typeof searchMock>>
		) => void = () => undefined;
		searchMock.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveSearch = resolve;
				})
		);
		const view = render(<WorkspaceMembersPage />);

		fireEvent.input(screen.getByLabelText("Find eligible user by email"), {
			target: { value: "candidate@example.test" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Search" }));
		fireEvent.click(screen.getByRole("button", { name: "Revoke role" }));

		routerState.workspaceUuid = "workspace-uuid-2";
		setState(null);
		view.rerender(<WorkspaceMembersPage />);
		await waitFor(() =>
			expect(
				screen.queryByRole("heading", { name: "Revoke workspace role?" })
			).toBeNull()
		);

		await act(async () => {
			resolveSearch([
				{
					email: "stale@example.test",
					name: "Stale Alpha Result",
					uuid: "stale-user-uuid",
				},
			]);
		});

		expect(screen.queryByText("Stale Alpha Result")).toBeNull();
		expect(revokeMock).not.toHaveBeenCalled();
	});
});
