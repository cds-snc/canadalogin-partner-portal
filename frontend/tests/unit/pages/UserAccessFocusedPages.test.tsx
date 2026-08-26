import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserGlobalAccessPage } from "@/features/users/pages/UserGlobalAccessPage";
import { UserInvitationsPage } from "@/features/users/pages/UserInvitationsPage";
import { UserWorkspaceAccessNewPage } from "@/features/users/pages/UserWorkspaceAccessNewPage";
import { UserWorkspaceAccessPage } from "@/features/users/pages/UserWorkspaceAccessPage";
import { useUserAccessAdministration } from "@/features/users/hooks/use-user-access-administration";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";

const navigate = vi.hoisted(() => vi.fn(() => Promise.resolve()));
const assignGlobal = vi.hoisted(() => vi.fn(() => Promise.resolve()));
const assignWorkspace = vi.hoisted(() => vi.fn(() => Promise.resolve()));

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: PropsWithChildren<{ to: string }>): ReactElement => (
		<a href={to}>{children}</a>
	),
	useNavigate: () => navigate,
	useParams: () => ({ userUuid: "user-uuid-1" }),
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
	ConfirmDialog: (): null => null,
	DataTable: ({
		action,
		rows,
	}: {
		action: never;
		rows: Array<Record<string, string>>;
	}): ReactElement => (
		<table>
			<tbody>
				{rows.map((row) => (
					<tr key={String(row["assignmentUuid"] ?? row["invitationUuid"])}>
						<th>{row["workspaceName"]}</th>
						<td>
							<a
								href={(action as { href: (value: typeof row) => string }).href(
									row
								)}
							>
								manage
							</a>
						</td>
					</tr>
				))}
			</tbody>
		</table>
	),
	Heading: ({
		children,
		tag,
	}: PropsWithChildren<{ tag: string }>): ReactElement =>
		tag === "h1" ? <h1>{children}</h1> : <h2>{children}</h2>,
	Notice: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
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
			invitationUuid: "invitation-uuid-1",
			inviteExpiresAt: "2026-09-01T12:00:00Z",
			role: "read_only",
			workspaceName: "Gamma",
			workspaceUuid: "workspace-uuid-3",
		},
	],
	user: { enabled: true, name: "Person One", uuid: "user-uuid-1" },
	workspaceAssignments: [
		{
			assignmentUuid: "assignment-uuid-1",
			role: "read_only",
			workspaceName: "Alpha",
			workspaceUuid: "workspace-uuid-1",
		},
	],
};

const setState = (access: typeof baseAccess): void => {
	vi.mocked(useUserAccessAdministration).mockReturnValue({
		access,
		assignGlobal,
		assignWorkspace,
		error: null,
		isLoading: false,
		isMutating: false,
	} as never);
};

describe("focused selected-user access pages", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		setState(baseAccess);
		vi.mocked(useWorkspaces).mockReturnValue({
			workspaces: [
				{ name: "Alpha", uuid: "workspace-uuid-1" },
				{ name: "Beta", uuid: "workspace-uuid-2" },
			],
		} as never);
	});

	it("assigns global access only when workspace access is absent", async () => {
		setState({ ...baseAccess, workspaceAssignments: [] });
		render(<UserGlobalAccessPage />);

		fireEvent.click(
			screen.getByRole("button", { name: "users.assignClAdminAction" })
		);
		await waitFor(() => expect(assignGlobal).toHaveBeenCalledOnce());
	});

	it("links workspace assignments and invitations to their focused workspace routes", () => {
		const { unmount } = render(<UserWorkspaceAccessPage />);
		expect(
			screen.getByRole("link", { name: "manage" }).getAttribute("href")
		).toBe("/workspaces/workspace-uuid-1/access/assignments/assignment-uuid-1");
		unmount();

		render(<UserInvitationsPage />);
		expect(
			screen.getByRole("link", { name: "manage" }).getAttribute("href")
		).toBe("/workspaces/workspace-uuid-3/access/invitations/invitation-uuid-1");
	});

	it("adds one workspace assignment and returns to the collection", async () => {
		render(<UserWorkspaceAccessNewPage />);
		fireEvent.input(screen.getByLabelText("users.inviteWorkspaceLabel"), {
			target: { value: "workspace-uuid-2" },
		});
		fireEvent.input(screen.getByLabelText("users.roleLabel"), {
			target: { value: "rp_user_edit" },
		});
		fireEvent.submit(
			screen
				.getByRole("button", { name: "users.assignAction" })
				.closest("form")!
		);

		await waitFor(() =>
			expect(assignWorkspace).toHaveBeenCalledWith(
				"workspace-uuid-2",
				"rp_user_edit"
			)
		);
		expect(navigate).toHaveBeenCalledWith({
			params: { userUuid: "user-uuid-1" },
			to: "/users/$userUuid/workspace-access",
		});
	});

	it("does not show an empty state while available workspaces are loading", () => {
		vi.mocked(useWorkspaces).mockReturnValue({
			error: null,
			isLoading: true,
			workspaces: [],
		} as never);

		render(<UserWorkspaceAccessNewPage />);

		expect(screen.getByText("users.inviteLoadingWorkspaces")).toBeTruthy();
		expect(screen.queryByText("users.noAvailableWorkspaces")).toBeNull();
		expect(screen.queryByLabelText("users.inviteWorkspaceLabel")).toBeNull();
	});

	it("fails closed when the available-workspace query fails", () => {
		vi.mocked(useWorkspaces).mockReturnValue({
			error: new Error("unavailable"),
			isLoading: false,
			workspaces: [],
		} as never);

		render(<UserWorkspaceAccessNewPage />);

		expect(screen.getByText("users.accessErrorBody")).toBeTruthy();
		expect(screen.queryByText("users.noAvailableWorkspaces")).toBeNull();
		expect(
			screen.queryByRole("button", { name: "users.assignAction" })
		).toBeNull();
	});
});
