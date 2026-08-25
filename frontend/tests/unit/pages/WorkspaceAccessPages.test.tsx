import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceAccessPage } from "@/features/workspaces/pages/WorkspaceAccessPage";
import { WorkspaceAccessAssignmentNewPage } from "@/features/workspaces/pages/WorkspaceAccessAssignmentNewPage";
import { WorkspaceAccessAssignmentPage } from "@/features/workspaces/pages/WorkspaceAccessAssignmentPage";
import { WorkspaceAccessAssignmentsPage } from "@/features/workspaces/pages/WorkspaceAccessAssignmentsPage";
import { WorkspaceAccessInvitationPage } from "@/features/workspaces/pages/WorkspaceAccessInvitationPage";
import { WorkspaceAccessInvitationsPage } from "@/features/workspaces/pages/WorkspaceAccessInvitationsPage";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";
import { useWorkspaceAccessInvitation } from "@/features/workspaces/hooks/use-workspace-access-invitation";
import { useWorkspaceAccessInvitations } from "@/features/workspaces/hooks/use-workspace-access-invitations";
import { useWorkspaceRoleAssignment } from "@/features/workspaces/hooks/use-workspace-role-assignment";
import { useWorkspaceRoleAssignments } from "@/features/workspaces/hooks/use-workspace-role-assignments";
import { useSession } from "@/hooks";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: PropsWithChildren<{ to: string }>): ReactElement => (
		<a href={to}>{children}</a>
	),
	useParams: () => ({
		assignmentUuid: "assignment-rp-user",
		invitationUuid: "invitation-pending",
		workspaceUuid: "workspace-1",
	}),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { language: "en" },
		t: (key: string): string => key,
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		disabled,
		onGcdsClick,
		type,
	}: PropsWithChildren<{
		disabled?: boolean;
		onGcdsClick?: () => void;
		type?: "button" | "submit";
	}>): ReactElement => (
		<button disabled={disabled} onClick={onGcdsClick} type={type ?? "button"}>
			{children}
		</button>
	),
	Card: ({
		cardTitle,
		href,
	}: {
		cardTitle: string;
		href: string;
	}): ReactElement => <a href={href}>{cardTitle}</a>,
	ConfirmDialog: ({
		confirmLabel,
		isOpen,
		onConfirm,
		title,
	}: {
		confirmLabel: string;
		isOpen: boolean;
		onConfirm: () => void;
		title: string;
	}): ReactElement | null =>
		isOpen ? (
			<section aria-label={title} role="dialog">
				<button onClick={onConfirm} type="button">
					{confirmLabel}
				</button>
			</section>
		) : null,
	DataTable: ({
		action,
		columns,
		emptyMessage,
		rows,
		title,
	}: {
		action?: {
			buttonLabel: string;
			href?: (row: Record<string, string>) => string;
			isVisible?: (row: Record<string, string>) => boolean;
			onAction?: (row: Record<string, string>) => void;
			screenReaderLabel?: (row: Record<string, string>) => string;
		};
		columns: Array<{
			field: string;
			headerName: string;
			valueFormatter?: (row: Record<string, string>) => string;
		}>;
		emptyMessage?: string;
		rows: Array<Record<string, string>>;
		title: string;
	}): ReactElement => (
		<table>
			<caption>{title}</caption>
			<thead>
				<tr>
					{columns.map((column) => (
						<th key={column.field}>{column.headerName}</th>
					))}
				</tr>
			</thead>
			<tbody>
				{rows.length === 0 ? (
					<tr>
						<td>{emptyMessage}</td>
					</tr>
				) : (
					rows.map((row) => (
						<tr key={row["assignmentUuid"] ?? row["uuid"]}>
							{columns.map((column) => (
								<td key={column.field}>
									{column.valueFormatter?.(row) ?? row[column.field]}
								</td>
							))}
							{action && (!action.isVisible || action.isVisible(row)) ? (
								<td>
									{action.href ? (
										<a href={action.href(row)}>
											{action.buttonLabel} {action.screenReaderLabel?.(row)}
										</a>
									) : (
										<button
											type="button"
											onClick={() => action.onAction?.(row)}
										>
											{action.buttonLabel} {action.screenReaderLabel?.(row)}
										</button>
									)}
								</td>
							) : null}
						</tr>
					))
				)}
			</tbody>
		</table>
	),
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag: string }>): ReactElement =>
		tag === "h1" ? <h1>{children}</h1> : <h2>{children}</h2>,
	Input: ({
		inputId,
		label,
		onInput,
		type,
		value,
	}: {
		inputId: string;
		label: string;
		onInput: (event: React.FormEvent<HTMLInputElement>) => void;
		type: string;
		value: string;
	}): ReactElement => (
		<label htmlFor={inputId}>
			{label}
			<input id={inputId} onInput={onInput} type={type} value={value} />
		</label>
	),
	Notice: ({
		children,
		noticeTitle,
	}: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
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
		onInput: (event: React.FormEvent<HTMLSelectElement>) => void;
		selectId: string;
		value: string;
	}>): ReactElement => (
		<label htmlFor={selectId}>
			{label}
			<select id={selectId} onInput={onInput} value={value}>
				{children}
			</select>
		</label>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/features/workspaces/hooks/use-workspace", () => ({
	useWorkspace: vi.fn(),
}));
vi.mock("@/features/workspaces/hooks/use-workspace-access-invitations", () => ({
	useWorkspaceAccessInvitations: vi.fn(),
}));
vi.mock("@/features/workspaces/hooks/use-workspace-access-invitation", () => ({
	useWorkspaceAccessInvitation: vi.fn(),
}));
vi.mock("@/features/workspaces/hooks/use-workspace-role-assignments", () => ({
	useWorkspaceRoleAssignments: vi.fn(),
}));
vi.mock("@/features/workspaces/hooks/use-workspace-role-assignment", () => ({
	useWorkspaceRoleAssignment: vi.fn(),
}));
vi.mock("@/hooks", () => ({ useSession: vi.fn() }));

const assignments = [
	{
		assignedAt: "2026-08-01T12:00:00Z",
		assignmentUuid: "assignment-rp-admin",
		role: "rp_admin",
		userEmail: "admin@example.test",
		userName: "Partner Admin",
		userUuid: "user-admin",
		workspaceUuid: "workspace-1",
	},
	{
		assignedAt: "2026-08-02T12:00:00Z",
		assignmentUuid: "assignment-rp-user",
		role: "rp_user_edit",
		userEmail: "editor@example.test",
		userName: "Partner Editor",
		userUuid: "user-editor",
		workspaceUuid: "workspace-1",
	},
];
const invitations = [
	{
		createdAt: "2026-08-01T12:00:00Z",
		invitedEmail: "first@example.test",
		inviteExpiresAt: "2026-09-01T12:00:00Z",
		role: "read_only",
		status: "pending",
		uuid: "invitation-pending",
	},
	{
		createdAt: "2026-08-02T12:00:00Z",
		invitedEmail: "second@example.test",
		inviteExpiresAt: "2026-09-02T12:00:00Z",
		role: "rp_user_edit",
		status: "expired",
		uuid: "invitation-expired",
	},
];
const assignmentActions = {
	assign: vi.fn(() => Promise.resolve()),
	replace: vi.fn(() => Promise.resolve()),
	revoke: vi.fn(() => Promise.resolve()),
	searchCandidates: vi.fn(() =>
		Promise.resolve([] as Array<{ email: string; name: string; uuid: string }>)
	),
};
const invitationActions = {
	createInvitation: vi.fn(() =>
		Promise.resolve({ acceptanceUrl: "https://local.test/invite" })
	),
	reissueInvitation: vi.fn(() =>
		Promise.resolve({ acceptanceUrl: "https://local.test/reissued" })
	),
	revokeInvitation: vi.fn(() => Promise.resolve()),
};

const setClAdmin = (): void => {
	vi.mocked(useSession).mockReturnValue({
		currentUser: {
			authorizationContext: { globalRole: "cl_admin", partnerAccess: [] },
		},
	} as never);
};
const setRpAdmin = (): void => {
	vi.mocked(useSession).mockReturnValue({
		currentUser: {
			authorizationContext: {
				globalRole: null,
				partnerAccess: [{ role: "rp_admin", workspaceUuid: "workspace-1" }],
			},
		},
	} as never);
};

describe("focused workspace Access pages", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		setClAdmin();
		vi.mocked(useWorkspace).mockReturnValue({
			workspace: { name: "Benefits", uuid: "workspace-1" },
		} as never);
		vi.mocked(useWorkspaceRoleAssignments).mockReturnValue({
			...assignmentActions,
			assignments,
			error: null,
			isAssigning: false,
			isLoading: false,
			isReplacing: false,
			isRevoking: false,
			isSearching: false,
		} as never);
		vi.mocked(useWorkspaceRoleAssignment).mockReturnValue({
			assignment: assignments[1],
			error: null,
			isLoading: false,
			isReplacing: false,
			isRevoking: false,
			replace: vi.fn(() => Promise.resolve()),
			revoke: vi.fn(() => Promise.resolve()),
		} as never);
		vi.mocked(useWorkspaceAccessInvitations).mockReturnValue({
			...invitationActions,
			error: null,
			invitations,
			isCreating: false,
			isLoading: false,
			isReissuing: false,
			isRevoking: false,
		} as never);
		vi.mocked(useWorkspaceAccessInvitation).mockReturnValue({
			error: null,
			invitation: invitations[0],
			isLoading: false,
			isReissuing: false,
			isRevoking: false,
			reissueInvitation: invitationActions.reissueInvitation,
			revokeInvitation: invitationActions.revokeInvitation,
		} as never);
	});

	it("renders a compact hub with four exact task destinations", () => {
		render(<WorkspaceAccessPage />);
		expect(
			screen.getAllByRole("link").map((link) => link.getAttribute("href"))
		).toEqual([
			"/workspaces/workspace-1/access/assignments",
			"/workspaces/workspace-1/access/assignments/new",
			"/workspaces/workspace-1/access/invitations",
			"/workspaces/workspace-1/access/invitations/new",
		]);
	});

	it("uses record-specific assignment and invitation links", () => {
		const view = render(<WorkspaceAccessAssignmentsPage />);
		expect(
			screen
				.getByRole("link", { name: /workspaces.manage Partner Editor/ })
				.getAttribute("href")
		).toBe("/workspaces/workspace-1/access/assignments/assignment-rp-user");
		view.unmount();
		render(<WorkspaceAccessInvitationsPage />);
		expect(
			screen
				.getByRole("link", { name: /workspaces.manage first@example.test/ })
				.getAttribute("href")
		).toBe("/workspaces/workspace-1/access/invitations/invitation-pending");
		expect(
			screen
				.getByRole("link", { name: /workspaces.manage second@example.test/ })
				.getAttribute("href")
		).toBe("/workspaces/workspace-1/access/invitations/invitation-expired");
	});

	it("keeps RP Admin from managing another RP Admin assignment", () => {
		setRpAdmin();
		render(<WorkspaceAccessAssignmentsPage />);
		expect(screen.queryByRole("link", { name: /Partner Admin/ })).toBeNull();
		expect(screen.getByRole("link", { name: /Partner Editor/ })).toBeTruthy();
	});

	it("searches and assigns only a lower role for an RP Admin", async () => {
		setRpAdmin();
		assignmentActions.searchCandidates.mockResolvedValueOnce([
			{ email: "person@example.test", name: "Person", uuid: "candidate-1" },
		]);
		render(<WorkspaceAccessAssignmentNewPage />);
		expect(
			screen.queryByRole("option", { name: "authorization.roles.rpAdmin" })
		).toBeNull();
		fireEvent.input(screen.getByLabelText("workspaces.searchUserByEmail"), {
			target: { value: "person@example.test" },
		});
		fireEvent.submit(
			screen.getByRole("button", { name: "common.search" }).closest("form")!
		);
		await screen.findByRole("button", {
			name: /workspaces.assignRoleAction Person/,
		});
		fireEvent.click(
			screen.getByRole("button", { name: /workspaces.assignRoleAction Person/ })
		);
		await waitFor(() =>
			expect(assignmentActions.assign).toHaveBeenCalledWith({
				role: "read_only",
				userUuid: "candidate-1",
			})
		);
	});

	it("shows a safe unavailable result for a stale assignment and revokes a pending invitation by UUID", async () => {
		vi.mocked(useWorkspaceRoleAssignment).mockReturnValue({
			assignment: null,
			error: null,
			isLoading: false,
			isReplacing: false,
			isRevoking: false,
		} as never);
		const view = render(<WorkspaceAccessAssignmentPage />);
		expect(
			screen.getByRole("heading", {
				name: "workspaces.accessRecordUnavailableTitle",
			})
		).toBeTruthy();
		view.unmount();

		render(<WorkspaceAccessInvitationPage />);
		fireEvent.click(
			screen.getByRole("button", {
				name: "workspaces.applicationsInvitationRevokeAction",
			})
		);
		fireEvent.click(
			screen
				.getByRole("dialog", {
					name: "workspaces.accessInvitationRevokeConfirmTitle",
				})
				.querySelector("button")!
		);
		await waitFor(() =>
			expect(invitationActions.revokeInvitation).toHaveBeenCalledWith()
		);
	});
});
