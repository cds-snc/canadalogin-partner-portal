import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceMembersPage } from "@/features/workspaces/pages/WorkspaceMembersPage";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";
import { useWorkspaceMembers } from "@/features/workspaces/hooks/use-workspace-members";

const addMemberMock = vi.fn(() =>
	Promise.resolve({
		createdAt: "2026-07-30T14:00:00Z",
		deletedAt: null,
		id: 14,
		isDeleted: false,
		role: "workspace_member",
		userEmail: "candidate@example.gc.ca",
		userId: 100,
		userName: "Candidate User",
		userUuid: "user-uuid-2",
		uuid: "membership-uuid-2",
		workspaceId: 9,
	})
);
const removeMemberMock = vi.fn(() => Promise.resolve());
const searchCandidatesMock = vi.fn(() =>
	Promise.resolve([
		{
			email: "candidate@example.gc.ca",
			name: "Candidate User",
			uuid: "user-uuid-2",
		},
	])
);
const updateMemberRoleMock = vi.fn(() =>
	Promise.resolve({
		createdAt: "2026-07-30T14:00:00Z",
		deletedAt: null,
		id: 12,
		isDeleted: false,
		role: "workspace_admin",
		userEmail: "member@example.gc.ca",
		userId: 99,
		userName: "Member User",
		userUuid: "user-uuid-1",
		uuid: "membership-uuid-1",
		workspaceId: 9,
	})
);

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string, options?: Record<string, unknown>) => string } => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"common.notAvailable": "Not available",
				"common.search": "Search",
				"common.searching": "Searching...",
				"workspaces.addMemberAction": "Add member",
				"workspaces.addingMemberAction": "Adding member...",
				"workspaces.cancelAction": "Cancel",
				"workspaces.currentMembers": "Current Members",
				"workspaces.memberAddedSuccess": "Member added successfully",
				"workspaces.memberEmail": "Email",
				"workspaces.memberName": "Name",
				"workspaces.memberRemovedSuccess": "Member removed successfully",
				"workspaces.memberRole": "Role",
				"workspaces.memberUpdatedSuccess": "Member role updated successfully",
				"workspaces.membersLoadingBody": "Loading the current members and workspace access controls.",
				"workspaces.membersLoadingTitle": "Loading workspace members",
				"workspaces.membersSummary": "Search for users, add them to this workspace, update roles, and remove access when needed.",
				"workspaces.noMembersBody": "Search for a user and add them to this workspace.",
				"workspaces.noMembersTitle": "No members yet",
				"workspaces.noSearchResults": "No matching users were found.",
				"workspaces.removeMemberAction": "Remove member",
				"workspaces.removeMemberConfirmTitle": "Remove member?",
				"workspaces.removingMemberAction": "Removing member...",
				"workspaces.roleAdmin": "Workspace admin",
				"workspaces.roleMember": "Workspace member",
				"workspaces.saveRoleAction": "Save role",
				"workspaces.searchResults": "Search Results",
				"workspaces.searchUsers": "Search Users",
				"workspaces.selectRole": "Select role",
				"workspaces.manageMembers": "Manage Members",
				"workspaces.membersSearchSummary": "Search for users who are not already members of this workspace.",
			};

			if (key === "workspaces.membersPageTitle") {
				return `Workspace Members - ${String(options?.["name"] ?? "")}`;
			}

			if (key === "workspaces.removeMemberConfirmBody") {
				return `This will remove ${String(options?.["name"] ?? "")} from the workspace.`;
			}

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useParams: (): { workspaceUuid: string } => ({ workspaceUuid: "workspace-uuid-1" }),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		onGcdsClick,
		type,
	}: PropsWithChildren<{
		onGcdsClick?: () => void;
		type: "button" | "link" | "reset" | "submit";
	}>): ReactElement =>
		type === "button" ? (
			<button onClick={onGcdsClick} type="button">
				{children}
			</button>
		) : (
			<a href="#">{children}</a>
		),
	ConfirmDialog: ({
		confirmLabel,
		description,
		isOpen,
		onClose,
		onConfirm,
		title,
	}: {
		confirmLabel: string;
		description: string;
		isOpen: boolean;
		onClose: () => void;
		onConfirm: () => void;
		title: string;
	}): ReactElement | null =>
		isOpen ? (
			<section>
				<h2>{title}</h2>
				<p>{description}</p>
				<button onClick={onClose} type="button">
					Cancel
				</button>
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
		action?: Array<{
			buttonLabel: string;
			onAction: (row: { role: string; userEmail: string; userName: string; userUuid: string; uuid: string }) => void;
		}>;
		columns: Array<{ cellRenderer?: (row: { role: string; userEmail: string; userName: string; userUuid: string; uuid: string }) => ReactElement | null; headerName: string }>;
		rows: Array<{ role: string; userEmail: string; userName: string; userUuid: string; uuid: string }>;
	}): ReactElement => (
		<section>
			{columns.map((column) => (
				<div key={column.headerName}>{column.headerName}</div>
			))}
			{rows.map((row) => (
				<div key={row.uuid}>
					<span>{row.userName}</span>
					<span>{row.userEmail}</span>
					{columns.map((column) =>
						column.cellRenderer ? (
							<div key={`${row.uuid}-${column.headerName}`}>{column.cellRenderer(row)}</div>
						) : null
					)}
					{action?.map((item) => (
						<button
							key={`${row.uuid}-${item.buttonLabel}`}
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
	Heading: ({ children }: PropsWithChildren): ReactElement => <h1>{children}</h1>,
	Input: ({ inputId, label, onInput, value }: { inputId: string; label: string; onInput?: (event: { target: { value: string } }) => void; value?: string }): ReactElement => (
		<label htmlFor={inputId}>
			<span>{label}</span>
			<input
				id={inputId}
				value={value}
				onInput={(event): void => {
					onInput?.({ target: { value: (event.target as HTMLInputElement).value } });
				}}
			/>
		</label>
	),
	Notice: ({ children, noticeTitle }: PropsWithChildren<{ noticeTitle: string }>): ReactElement => (
		<section>
			<h2>{noticeTitle}</h2>
			{children}
		</section>
	),
	Select: ({ children, onInput, selectId, value }: PropsWithChildren<{ onInput?: (event: { target: { value: string } }) => void; selectId: string; value?: string }>): ReactElement => (
		<select
			id={selectId}
			value={value}
			onInput={(event): void => {
				onInput?.({ target: { value: (event.target as HTMLSelectElement).value } });
			}}
		>
			{children}
		</select>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock("@/features/workspaces/hooks/use-workspace", () => ({
	useWorkspace: vi.fn(),
}));

vi.mock("@/features/workspaces/hooks/use-workspace-members", () => ({
	useWorkspaceMembers: vi.fn(),
}));

describe("WorkspaceMembersPage", () => {
	it("searches for candidates, adds a member, updates a role, and removes a member", async () => {
		vi.mocked(useWorkspace).mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			workspace: {
				createdAt: "2026-07-30T12:00:00Z",
				createdBy: 42,
				deletedAt: null,
				description: "Primary workspace",
				departmentId: 7,
				id: 9,
				isDeleted: false,
				name: "Benefits Workspace",
				slug: "benefits-workspace",
				updatedAt: null,
				uuid: "workspace-uuid-1",
			},
		});
		vi.mocked(useWorkspaceMembers).mockReturnValue({
			addMember: addMemberMock,
			error: null,
			isAdding: false,
			isLoading: false,
			isRemoving: false,
			isSearching: false,
			isUpdatingRole: false,
			members: [
				{
					createdAt: "2026-07-30T14:00:00Z",
					deletedAt: null,
					id: 12,
					isDeleted: false,
					role: "workspace_member",
					userEmail: "member@example.gc.ca",
					userId: 99,
					userName: "Member User",
					userUuid: "user-uuid-1",
					uuid: "membership-uuid-1",
					workspaceId: 9,
				},
			],
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			removeMember: removeMemberMock,
			searchCandidates: searchCandidatesMock,
			updateMemberRole: updateMemberRoleMock,
		});

		render(<WorkspaceMembersPage />);

		fireEvent.input(screen.getByLabelText(/search users/i), {
			target: { value: "candidate" },
		});
		fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

		await waitFor(() => {
			expect(searchCandidatesMock).toHaveBeenCalledWith("candidate");
		});

		fireEvent.click(screen.getByRole("button", { name: /add member/i }));

		await waitFor(() => {
			expect(addMemberMock).toHaveBeenCalledWith({
				role: "workspace_member",
				userUuid: "user-uuid-2",
			});
		});

		fireEvent.input(screen.getAllByDisplayValue(/workspace member/i)[1]!, {
			target: { value: "workspace_admin" },
		});
		fireEvent.click(screen.getByRole("button", { name: /save role/i }));

		await waitFor(() => {
			expect(updateMemberRoleMock).toHaveBeenCalledWith("user-uuid-1", {
				role: "workspace_admin",
			});
		});

		fireEvent.click(screen.getByRole("button", { name: /remove member/i }));
		fireEvent.click(screen.getAllByRole("button", { name: /remove member/i })[1]!);

		await waitFor(() => {
			expect(removeMemberMock).toHaveBeenCalledWith("user-uuid-1");
		});

		expect(
			screen.getByRole("heading", { name: /member removed successfully/i })
		).toBeTruthy();
	});
});