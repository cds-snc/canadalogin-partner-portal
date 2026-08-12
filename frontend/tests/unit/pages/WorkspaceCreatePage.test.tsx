import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceCreatePage } from "@/features/workspaces/pages/WorkspaceCreatePage";
import { useWorkspaceManagement } from "@/features/workspaces/hooks/use-workspace-management";
import { useSession } from "@/hooks";

const navigateMock = vi.fn(() => Promise.resolve());
const createWorkspaceMock = vi.fn(() =>
	Promise.resolve({
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
	})
);

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"workspaces.cancelAction": "Cancel",
				"workspaces.createAction": "Create workspace",
				"workspaces.createPageTitle": "Create workspace",
				"workspaces.createSummary": "Create a workspace for your department.",
				"workspaces.creatingAction": "Creating workspace...",
				"workspaces.departmentContextFallback": "Uses your account department.",
				"workspaces.descriptionLabel": "Description",
				"workspaces.nameLabel": "Name",
				"workspaces.slugHint": "Optional slug",
				"workspaces.slugLabel": "Slug",
			};

			if (key === "workspaces.departmentContext") {
				return `Current department: ${String(options?.["department"] ?? "")}`;
			}

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigateMock => navigateMock,
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		href,
		onGcdsClick,
		type,
	}: PropsWithChildren<{
		href?: string;
		onGcdsClick?: () => void;
		type: "button" | "link" | "reset" | "submit";
	}>): ReactElement =>
		type === "link" ? (
			<a href={href}>{children}</a>
		) : (
			<button onClick={onGcdsClick} type="button">
				{children}
			</button>
		),
	Heading: ({ children }: PropsWithChildren): ReactElement => (
		<h1>{children}</h1>
	),
	Input: ({
		inputId,
		label,
		onInput,
		value,
	}: {
		inputId: string;
		label: string;
		onInput?: (event: { target: { value: string } }) => void;
		value?: string;
	}): ReactElement => (
		<label htmlFor={inputId}>
			<span>{label}</span>
			<input
				id={inputId}
				value={value}
				onInput={(event): void => {
					onInput?.({
						target: { value: (event.target as HTMLInputElement).value },
					});
				}}
			/>
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
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
	Textarea: ({
		label,
		onInput,
		textareaId,
		value,
	}: {
		label: string;
		onInput?: (event: { target: { value: string } }) => void;
		textareaId: string;
		value?: string;
	}): ReactElement => (
		<label htmlFor={textareaId}>
			<span>{label}</span>
			<textarea
				id={textareaId}
				value={value}
				onInput={(event): void => {
					onInput?.({
						target: { value: (event.target as HTMLTextAreaElement).value },
					});
				}}
			/>
		</label>
	),
}));

vi.mock("@/features/workspaces/hooks/use-workspace-management", () => ({
	useWorkspaceManagement: vi.fn(),
}));

vi.mock("@/hooks", () => ({
	useSession: vi.fn(),
}));

describe("WorkspaceCreatePage", () => {
	it("creates a workspace against the current user department and redirects to detail", async () => {
		vi.mocked(useSession).mockReturnValue({
			currentUser: {
				acceptedTermsAt: "2026-06-11T12:00:00Z",
				authorizationContext: {
					globalRole: "cl_admin",
					partnerAccess: [],
				},
				departmentAbbreviation: "TBS",
				departmentUuid: "department-uuid-1",
				email: "member@example.gc.ca",
				name: "Member User",
				profileImageUrl: "",
				termsVersion: "2026-01",
				tierUuid: null,
				uuid: "user-uuid-1",
				username: "member@example.gc.ca",
			},
			isAuthenticated: true,
			isLoading: false,
			login: vi.fn(),
			logout: vi.fn(async () => undefined),
			refreshSession: vi.fn(async () => null),
		});
		vi.mocked(useWorkspaceManagement).mockReturnValue({
			createWorkspace: createWorkspaceMock,
			deleteWorkspace: vi.fn(async () => undefined),
			isCreating: false,
			isDeleting: false,
			isUpdating: false,
			updateWorkspace: vi.fn(),
		});

		render(<WorkspaceCreatePage />);

		fireEvent.input(screen.getByLabelText(/^name$/i), {
			target: { value: "Benefits Workspace" },
		});
		fireEvent.input(screen.getByLabelText(/^slug$/i), {
			target: { value: "benefits-workspace" },
		});
		fireEvent.input(screen.getByLabelText(/^description$/i), {
			target: { value: "Primary workspace" },
		});
		fireEvent.click(screen.getByRole("button", { name: /create workspace/i }));

		expect(createWorkspaceMock).toHaveBeenCalledWith({
			departmentUuid: "department-uuid-1",
			description: "Primary workspace",
			name: "Benefits Workspace",
			slug: "benefits-workspace",
		});

		await waitFor(() => {
			expect(navigateMock).toHaveBeenCalledWith({
				params: { workspaceUuid: "workspace-uuid-1" },
				replace: true,
				search: { created: "1" },
				to: "/workspaces/$workspaceUuid",
			});
		});
	});
});
