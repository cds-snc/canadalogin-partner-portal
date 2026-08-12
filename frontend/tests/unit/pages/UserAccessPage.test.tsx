import type { PropsWithChildren, ReactElement } from "react";
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserAccessPage } from "@/features/users/pages/UserAccessPage";
import { useUserAccessAdministration } from "@/features/users/hooks/use-user-access-administration";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";

const accessActions = vi.hoisted(() => ({
	assignGlobal: vi.fn(() => Promise.resolve()),
	assignWorkspace: vi.fn(() => Promise.resolve()),
	replaceWorkspace: vi.fn(() => Promise.resolve()),
	revokeGlobal: vi.fn(() => Promise.resolve()),
	revokeInvitation: vi.fn(() => Promise.resolve()),
	revokeWorkspace: vi.fn(() => Promise.resolve()),
}));

vi.mock("@tanstack/react-router", () => ({
	useParams: () => ({ userUuid: "user-uuid-1" }),
}));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>): string =>
			key === "users.accessTitle"
				? `Access for ${String(options?.["name"])}`
				: ({
						"authorization.roles.readOnly": "Read Only",
						"authorization.roles.rpAdmin": "RP Admin",
						"authorization.roles.rpUserEdit": "RP User (Edit)",
						"common.cancel": "Cancel",
						"users.accessAssignedSuccess": "Workspace access assigned",
						"users.accessRevokedSuccess": "Access revoked",
						"users.accessSavedSuccess": "Access saved",
						"users.accountStatusActive": "Active",
						"users.addWorkspaceAccessTitle": "Add workspace access",
						"users.assignAction": "Assign",
						"users.assignClAdminAction": "Assign CL Admin",
						"users.backToUsersAction": "Back to users",
						"users.clAdminAssignedBody": "CL Admin is assigned.",
						"users.clAdminAssignedSuccess": "CL Admin assigned",
						"users.globalAccessTitle": "Global access",
						"users.inviteWorkspaceLabel": "Workspace",
						"users.inviteWorkspacePlaceholder": "Select a workspace",
						"users.noCanonicalGlobalRole":
							"No canonical global role is assigned.",
						"users.noPendingInvitations": "No pending invitations",
						"users.pendingInvitationsTitle": "Pending invitations",
						"users.profileSummaryTitle": "User",
						"users.revokeAccessConfirmBody": "This access will be removed.",
						"users.revokeAccessConfirmTitle": "Revoke access?",
						"users.revokeAction": "Revoke",
						"users.roleLabel": "Role",
						"users.saveActionShort": "Save",
						"users.workspaceAccessTitle": "Workspace access",
					}[key] ?? key),
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		disabled,
		href,
		onGcdsClick,
		type,
	}: PropsWithChildren<{
		disabled?: boolean;
		href?: string;
		onGcdsClick?: () => void;
		type?: string;
	}>): ReactElement =>
		type === "link" ? (
			<a href={href}>{children}</a>
		) : (
			<button disabled={disabled} onClick={onGcdsClick} type="button">
				{children}
			</button>
		),
	ConfirmDialog: ({
		confirmLabel,
		description,
		isOpen,
		onConfirm,
		title,
	}: {
		confirmLabel: string;
		description: string;
		isOpen: boolean;
		onConfirm: () => void;
		title: string;
	}): ReactElement | null =>
		isOpen ? (
			<section aria-label={title} role="dialog">
				<p>{description}</p>
				<button onClick={onConfirm} type="button">
					{confirmLabel}
				</button>
			</section>
		) : null,
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag: "h1" | "h2" | "h3" }>): ReactElement => {
		if (tag === "h1") return <h1>{children}</h1>;
		if (tag === "h3") return <h3>{children}</h3>;
		return <h2>{children}</h2>;
	},
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

vi.mock("@/features/users/hooks/use-user-access-administration", () => ({
	useUserAccessAdministration: vi.fn(),
}));
vi.mock("@/features/workspaces/hooks/use-workspaces", () => ({
	useWorkspaces: vi.fn(),
}));

const baseAccess = {
	globalAssignment: null,
	pendingInvitations: [
		{
			createdAt: "2026-08-12T12:00:00Z",
			invitationUuid: "invitation-uuid-1",
			inviteExpiresAt: "2026-08-19T12:00:00Z",
			role: "read_only" as const,
			status: "pending" as const,
			workspaceName: "Gamma",
			workspaceUuid: "workspace-uuid-3",
		},
	],
	user: {
		email: "person@example.test",
		enabled: true,
		name: "Person One",
		username: "person@example.test",
		uuid: "user-uuid-1",
	},
	workspaceAssignments: [
		{
			assignedAt: "2026-08-12T12:00:00Z",
			assignmentUuid: "assignment-uuid-1",
			role: "read_only" as const,
			workspaceName: "Alpha",
			workspaceUuid: "workspace-uuid-1",
		},
	],
};

const setState = (access: typeof baseAccess = baseAccess): void => {
	vi.mocked(useUserAccessAdministration).mockReturnValue({
		access,
		...accessActions,
		error: null,
		isLoading: false,
		isMutating: false,
		refetch: vi.fn(),
	});
	vi.mocked(useWorkspaces).mockReturnValue({
		workspaces: [
			{ name: "Alpha", uuid: "workspace-uuid-1" },
			{ name: "Beta", uuid: "workspace-uuid-2" },
		],
	} as never);
};

describe("UserAccessPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("manages existing, new, and pending workspace access without provider metadata", async () => {
		setState();
		render(<UserAccessPage />);

		expect(
			screen.getByRole("heading", { name: "Access for Person One", level: 1 })
		).toBeTruthy();
		expect(screen.getByText("person@example.test")).toBeTruthy();
		expect(screen.queryByText(/auth provider/i)).toBeNull();
		expect(
			screen.queryByRole("button", { name: "Assign CL Admin" })
		).toBeNull();

		fireEvent.input(document.querySelector("#role-workspace-uuid-1")!, {
			target: { value: "rp_admin" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Save" }));
		await waitFor(() =>
			expect(accessActions.replaceWorkspace).toHaveBeenCalledWith(
				"workspace-uuid-1",
				"rp_admin"
			)
		);

		fireEvent.input(screen.getByLabelText("Workspace"), {
			target: { value: "workspace-uuid-2" },
		});
		fireEvent.input(document.querySelector("#new-workspace-role")!, {
			target: { value: "rp_user_edit" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Assign" }));
		await waitFor(() =>
			expect(accessActions.assignWorkspace).toHaveBeenCalledWith(
				"workspace-uuid-2",
				"rp_user_edit"
			)
		);

		const invitation = screen
			.getByRole("heading", { name: "Gamma" })
			.closest("div");
		expect(invitation).not.toBeNull();
		fireEvent.click(
			within(invitation!).getByRole("button", { name: "Revoke" })
		);
		fireEvent.click(
			within(screen.getByRole("dialog", { name: "Revoke access?" })).getByRole(
				"button",
				{ name: "Revoke" }
			)
		);
		await waitFor(() =>
			expect(accessActions.revokeInvitation).toHaveBeenCalledWith(
				"workspace-uuid-3",
				"invitation-uuid-1"
			)
		);
	});

	it("offers CL Admin only when the user has no partner access", async () => {
		setState({
			...baseAccess,
			pendingInvitations: [],
			workspaceAssignments: [],
		});
		render(<UserAccessPage />);

		fireEvent.click(screen.getByRole("button", { name: "Assign CL Admin" }));

		await waitFor(() => expect(accessActions.assignGlobal).toHaveBeenCalled());
	});
});
