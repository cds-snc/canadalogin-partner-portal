import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspacesPage } from "@/features/workspaces/pages/WorkspacesPage";
import { useWorkspaces } from "@/features/workspaces/hooks/use-workspaces";

const navigateMock = vi.fn();
const useSearchMock = vi.fn(() => ({}));

vi.mock("react-i18next", () => ({
	useTranslation: (): {
		t: (key: string, options?: Record<string, unknown>) => string;
	} => ({
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"common.notAvailable": "Not available",
				"workspaces.createAction": "Create workspace",
				"workspaces.clAdminTasksTitle": "CL Admin tasks",
				"workspaces.deletedSuccess": "Workspace deleted successfully",
				"workspaces.emptyBody":
					"No workspaces are available for your account yet.",
				"workspaces.emptyTitle": "No workspaces yet",
				"workspaces.loadingBody":
					"Loading workspaces available to your account.",
				"workspaces.loadingTitle": "Loading workspaces",
				"workspaces.nameLabel": "Name",
				"workspaces.onboardingStateColumn": "Onboarding status",
				"workspaces.onboardingStateUnderReview": "Under review",
				"workspaces.rpAdoptionTaskAction": "Adopt existing RP registrations",
				"workspaces.rpAdoptionTaskDescription": "Link retained registrations.",
				"workspaces.slugLabel": "Slug",
				"workspaces.summary": "Review and manage workspaces.",
				"workspaces.title": "Workspaces",
				"workspaces.viewAction": "View workspace",
			};

			if (key === "workspaces.workspaceTitle") {
				return `Workspace - ${String(options?.["name"] ?? "")}`;
			}

			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: (): typeof navigateMock => navigateMock,
	useSearch: (): ReturnType<typeof useSearchMock> => useSearchMock(),
}));

vi.mock("@/hooks", () => ({
	useSession: () => ({
		currentUser: {
			authorizationContext: { globalRole: "cl_admin", partnerAccess: [] },
		},
	}),
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
	DataTable: ({
		action,
		columns,
		primaryAction,
		rows,
		title,
	}: {
		action?: {
			buttonLabel: string;
			onAction: (row: {
				name: string;
				onboardingState: string;
				slug: string;
				uuid: string;
			}) => void;
		};
		columns: Array<{ headerName: string }>;
		primaryAction?: { buttonLabel: string; onAction: () => void };
		rows: Array<{
			name: string;
			onboardingState: string;
			slug: string;
			uuid: string;
		}>;
		title: string;
	}): ReactElement => (
		<section>
			<h2>{title}</h2>
			{columns.map((column) => (
				<span key={column.headerName}>{column.headerName}</span>
			))}
			{rows.map((row) => (
				<div key={row.uuid}>
					<span>{row.name}</span>
					<span>{row.slug}</span>
					<span>{row.onboardingState}</span>
				</div>
			))}
			{primaryAction ? (
				<button onClick={primaryAction.onAction} type="button">
					{primaryAction.buttonLabel}
				</button>
			) : null}
			{action && rows[0] ? (
				<button onClick={() => action.onAction(rows[0]!)} type="button">
					{action.buttonLabel}
				</button>
			) : null}
		</section>
	),
	Heading: ({ children }: PropsWithChildren): ReactElement => (
		<h1>{children}</h1>
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
}));

vi.mock("@/features/workspaces/hooks/use-workspaces", () => ({
	useWorkspaces: vi.fn(),
}));

describe("WorkspacesPage", () => {
	it("renders loading and empty states", () => {
		useSearchMock.mockReturnValue({});
		vi.mocked(useWorkspaces)
			.mockReturnValueOnce({
				error: null,
				isLoading: true,
				refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
				workspaces: [],
			})
			.mockReturnValueOnce({
				error: null,
				isLoading: false,
				refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
				workspaces: [],
			});

		const { rerender } = render(<WorkspacesPage />);

		expect(
			screen.getByRole("heading", { name: /loading workspaces/i })
		).toBeTruthy();

		rerender(<WorkspacesPage />);

		expect(
			screen.getByRole("heading", { name: /no workspaces yet/i })
		).toBeTruthy();
		expect(
			screen.getByRole("link", { name: /create workspace/i })
		).toBeTruthy();
	});

	it("renders delete success feedback from route search state", () => {
		useSearchMock.mockReturnValue({ deleted: "1" });
		vi.mocked(useWorkspaces).mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			workspaces: [],
		});

		render(<WorkspacesPage />);

		expect(
			screen.getByRole("heading", { name: /workspace deleted successfully/i })
		).toBeTruthy();
	});

	it("exposes the CL Admin adoption task from Workspaces", () => {
		useSearchMock.mockReturnValue({});
		vi.mocked(useWorkspaces).mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			workspaces: [],
		});

		render(<WorkspacesPage />);

		expect(
			screen
				.getByRole("link", { name: "Adopt existing RP registrations" })
				.getAttribute("href")
		).toBe("/workspaces/rp-registration-adoption");
	});

	it("navigates to the selected workspace detail route", () => {
		useSearchMock.mockReturnValue({});
		vi.mocked(useWorkspaces).mockReturnValue({
			error: null,
			isLoading: false,
			refetch: vi.fn((): Promise<unknown> => Promise.resolve()),
			workspaces: [
				{
					createdAt: "2026-07-30T12:00:00Z",
					createdBy: 42,
					deletedAt: null,
					description: "Primary workspace",
					departmentId: 7,
					id: 9,
					isDeleted: false,
					name: "Benefits Workspace",
					onboardingState: "under_review",
					slug: "benefits-workspace",
					updatedAt: null,
					uuid: "workspace-uuid-1",
				},
			],
		});

		render(<WorkspacesPage />);
		expect(screen.getByText(/under review/i)).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: /view workspace/i }));

		expect(navigateMock).toHaveBeenCalledWith({
			params: { workspaceUuid: "workspace-uuid-1" },
			to: "/workspaces/$workspaceUuid",
		});
	});
});
