import type { PropsWithChildren, ReactElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceApplicationEditPage } from "@/features/workspaces/pages/WorkspaceApplicationEditPage";
import { useWorkspaceRPApplication } from "@/features/workspaces/hooks/use-workspace-rp-applications";
import { useWorkspaceRPRegistrationDraft } from "@/features/workspaces/hooks/use-workspace-rp-registration";

const navigateMock = vi.fn(() => Promise.resolve());

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>): string =>
			key === "workspaces.registration.lockedBody"
				? `Locked ${String(options?.["status"] ?? "")}`
				: ({
						"workspaces.applicationsBackToDetail": "Back to application detail",
						"workspaces.applicationsSectionTitle": "RP applications",
						"workspaces.registration.lockedTitle": "Registration is read-only",
					}[key] ?? key),
	}),
}));
vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
	useParams: () => ({
		rpApplicationUuid: "rp-application-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
}));
vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		href,
	}: PropsWithChildren<{ href?: string }>): ReactElement => (
		<a href={href}>{children}</a>
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
vi.mock("@/features/workspaces/hooks/use-workspace-rp-applications", () => ({
	useWorkspaceRPApplication: vi.fn(),
}));
vi.mock("@/features/workspaces/hooks/use-workspace-rp-registration", () => ({
	useWorkspaceRPRegistrationDraft: vi.fn(),
}));

const application = {
	createdAt: "2026-08-12T12:00:00Z",
	createdBy: 42,
	dnrAppName: "Benefits Portal",
	id: 21,
	isDeleted: false,
	status: null,
	uuid: "rp-application-uuid-1",
	workspaceId: 9,
};

describe("WorkspaceApplicationEditPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useWorkspaceRPRegistrationDraft).mockReturnValue({
			draft: null,
			error: null,
			isLoading: false,
			refetch: vi.fn(),
		});
	});

	it("migrates a draft Edit route to the earliest incomplete registration step", async () => {
		vi.mocked(useWorkspaceRPApplication).mockReturnValue({
			application: { ...application, onboardingState: "draft" },
			error: null,
			isLoading: false,
			refetch: vi.fn(),
		});
		vi.mocked(useWorkspaceRPRegistrationDraft).mockReturnValue({
			draft: {
				onboardingState: "draft",
				registrationAnswers: {},
				registrationDraftVersion: 3,
				registrationLastCompletedStep: "endpoints",
				rpApplicationUuid: "rp-application-uuid-1",
				workspaceUuid: "workspace-uuid-1",
			},
			error: null,
			isLoading: false,
			refetch: vi.fn(),
		});

		render(<WorkspaceApplicationEditPage />);
		await waitFor(() =>
			expect(navigateMock).toHaveBeenCalledWith({
				href: "/workspaces/workspace-uuid-1/applications/rp-application-uuid-1/registration/client-and-access",
				replace: true,
			})
		);
	});

	it.each(["submitted", "under_review", "approved", "launched", "unexpected"])(
		"returns a %s application to detail with a locked explanation",
		(onboardingState) => {
			vi.mocked(useWorkspaceRPApplication).mockReturnValue({
				application: { ...application, onboardingState },
				error: null,
				isLoading: false,
				refetch: vi.fn(),
			});

			render(<WorkspaceApplicationEditPage />);
			expect(screen.getByText("Registration is read-only")).toBeTruthy();
			expect(screen.getByText(`Locked ${onboardingState}`)).toBeTruthy();
			expect(
				screen.getByRole("link", { name: "Back to application detail" })
			).toBeTruthy();
		}
	);
});
