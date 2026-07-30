import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceSettingsPage } from "@/features/workspaces/pages/WorkspaceSettingsPage";
import { useWorkspace } from "@/features/workspaces/hooks/use-workspace";
import { useWorkspaceManagement } from "@/features/workspaces/hooks/use-workspace-management";

const navigateMock = vi.fn(() => Promise.resolve());
const deleteWorkspaceMock = vi.fn(() => Promise.resolve());
const updateWorkspaceMock = vi.fn(() =>
	Promise.resolve({
		createdAt: "2026-07-30T12:00:00Z",
		createdBy: 42,
		deletedAt: null,
		description: "Updated workspace",
		departmentId: 7,
		id: 9,
		isDeleted: false,
		name: "Renamed Workspace",
		slug: "renamed-workspace",
		updatedAt: "2026-07-30T12:15:00Z",
		uuid: "workspace-uuid-1",
	})
);

vi.mock("react-i18next", () => ({
	useTranslation: (): { t: (key: string, options?: Record<string, unknown>) => string } => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"workspaces.cancelAction": "Cancel",
				"workspaces.deleteAction": "Delete workspace",
				"workspaces.deleteConfirmTitle": "Delete workspace?",
				"workspaces.deletingAction": "Deleting workspace...",
				"workspaces.descriptionLabel": "Description",
				"workspaces.detailLoadingBody": "Loading the selected workspace.",
				"workspaces.detailLoadingTitle": "Loading workspace",
				"workspaces.nameLabel": "Name",
				"workspaces.saveAction": "Save workspace",
				"workspaces.savingAction": "Saving workspace...",
				"workspaces.settingsSummary": "Update the workspace metadata.",
				"workspaces.slugHint": "Optional slug",
				"workspaces.slugLabel": "Slug",
				"workspaces.workspaceLabel": "Workspace",
			};

			if (key === "workspaces.settingsPageTitle") {
				return `Workspace settings - ${String(options?.["name"] ?? "")}`;
			}

			if (key === "workspaces.deleteConfirmBody") {
				return `This will permanently remove the workspace \"${String(options?.["name"] ?? "")}\".`;
			}

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigateMock => navigateMock,
	useParams: (): { workspaceUuid: string } => ({ workspaceUuid: "workspace-uuid-1" }),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		buttonRole,
		href,
		onGcdsClick,
		type,
	}: PropsWithChildren<{
		buttonRole?: "danger" | "primary" | "secondary" | "start";
		href?: string;
		onGcdsClick?: () => void;
		type: "button" | "link" | "reset" | "submit";
	}>): ReactElement =>
		type === "link" ? (
			<a href={href}>{children}</a>
		) : (
			<button data-role={buttonRole} onClick={onGcdsClick} type="button">
				{children}
			</button>
		),
	ConfirmDialog: ({
		confirmLabel,
		description,
		isOpen,
		onClose,
		onConfirm,
		title,
	}: {
		confirmLabel?: string;
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
					{confirmLabel ?? "Confirm"}
				</button>
			</section>
		) : null,
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
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
	Textarea: ({ label, onInput, textareaId, value }: { label: string; onInput?: (event: { target: { value: string } }) => void; textareaId: string; value?: string }): ReactElement => (
		<label htmlFor={textareaId}>
			<span>{label}</span>
			<textarea
				id={textareaId}
				value={value}
				onInput={(event): void => {
					onInput?.({ target: { value: (event.target as HTMLTextAreaElement).value } });
				}}
			/>
		</label>
	),
}));

vi.mock("@/features/workspaces/hooks/use-workspace", () => ({
	useWorkspace: vi.fn(),
}));

vi.mock("@/features/workspaces/hooks/use-workspace-management", () => ({
	useWorkspaceManagement: vi.fn(),
}));

describe("WorkspaceSettingsPage", () => {
	it("updates a workspace and redirects back to detail with success search state", async () => {
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
		vi.mocked(useWorkspaceManagement).mockReturnValue({
			createWorkspace: vi.fn(),
			deleteWorkspace: deleteWorkspaceMock,
			isCreating: false,
			isDeleting: false,
			isUpdating: false,
			updateWorkspace: updateWorkspaceMock,
		});

		render(<WorkspaceSettingsPage />);

		fireEvent.input(screen.getByLabelText(/^name$/i), {
			target: { value: "Renamed Workspace" },
		});
		fireEvent.input(screen.getByLabelText(/^slug$/i), {
			target: { value: "renamed-workspace" },
		});
		fireEvent.input(screen.getByLabelText(/^description$/i), {
			target: { value: "Updated workspace" },
		});
		fireEvent.click(screen.getByRole("button", { name: /save workspace/i }));

		expect(updateWorkspaceMock).toHaveBeenCalledWith("workspace-uuid-1", {
			description: "Updated workspace",
			name: "Renamed Workspace",
			slug: "renamed-workspace",
		});

		await waitFor(() => {
			expect(navigateMock).toHaveBeenCalledWith({
				params: { workspaceUuid: "workspace-uuid-1" },
				replace: true,
				search: { updated: "1" },
				to: "/workspaces/$workspaceUuid",
			});
		});
	});

	it("deletes a workspace and redirects back to the list with success search state", async () => {
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
		vi.mocked(useWorkspaceManagement).mockReturnValue({
			createWorkspace: vi.fn(),
			deleteWorkspace: deleteWorkspaceMock,
			isCreating: false,
			isDeleting: false,
			isUpdating: false,
			updateWorkspace: updateWorkspaceMock,
		});

		render(<WorkspaceSettingsPage />);

		fireEvent.click(
			screen.getByRole("button", { name: /delete workspace/i })
		);
		fireEvent.click(
			screen.getAllByRole("button", { name: /delete workspace/i })[1]!
		);

		expect(deleteWorkspaceMock).toHaveBeenCalledWith("workspace-uuid-1");

		await waitFor(() => {
			expect(navigateMock).toHaveBeenCalledWith({
				replace: true,
				search: { deleted: "1" },
				to: "/workspaces",
			});
		});
	});
});