import type { PropsWithChildren, ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useApplicationInformationManagement } from "@/features/workspaces/hooks/use-application-information-management";
import { useWorkspaceApplicationInformation } from "@/features/workspaces/hooks/use-workspace-application-information";
import { ApplicationInformationDeletePage } from "@/features/workspaces/pages/ApplicationInformationDeletePage";

const deleteApplicationMock = vi.fn(() => Promise.resolve());
const navigateMock = vi.fn(() => Promise.resolve());

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: { resolvedLanguage: "en" },
		t: (key: string, options?: Record<string, unknown>): string => {
			const translations: Record<string, string> = {
				"workspaces.appInfoDelete": "Delete application",
				"workspaces.appInfoDeleteConfirmBody": `Delete ${String(options?.["name"] ?? "")}`,
				"workspaces.appInfoDeleteConfirmTitle": "Delete application",
				"workspaces.appInfoDeleteDescription":
					"Deletion remains blocked while an RP configuration is linked.",
				"workspaces.cancelAction": "Cancel",
			};
			return translations[key] ?? key;
		},
	}),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
	useParams: () => ({
		applicationInformationUuid: "application-information-uuid-1",
		workspaceUuid: "workspace-uuid-1",
	}),
}));

vi.mock("@/components/ui", () => ({
	Button: ({
		children,
		onGcdsClick,
	}: PropsWithChildren<{ onGcdsClick?: () => void }>): ReactElement => (
		<button type="button" onClick={onGcdsClick}>
			{children}
		</button>
	),
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
			<div aria-label={title} role="dialog">
				<button type="button" onClick={onConfirm}>
					{confirmLabel}
				</button>
			</div>
		) : null,
	Heading: ({
		children,
		tag = "h2",
	}: PropsWithChildren<{ tag?: "h1" | "h2" }>): ReactElement => {
		const Tag = tag;
		return <Tag>{children}</Tag>;
	},
	Notice: ({ children }: PropsWithChildren): ReactElement => (
		<section>{children}</section>
	),
	Text: ({ children }: PropsWithChildren): ReactElement => <p>{children}</p>,
}));

vi.mock(
	"@/features/workspaces/hooks/use-application-information-management",
	() => ({ useApplicationInformationManagement: vi.fn() })
);

vi.mock(
	"@/features/workspaces/hooks/use-workspace-application-information",
	() => ({ useWorkspaceApplicationInformation: vi.fn() })
);

describe("ApplicationInformationDeletePage", () => {
	it("keeps deletion on a dedicated page and requires confirmation", async () => {
		vi.mocked(useWorkspaceApplicationInformation).mockReturnValue({
			applicationInformation: {
				createdAt: "2026-08-13T00:00:00Z",
				createdBy: 42,
				deletedAt: null,
				id: 17,
				isDeleted: false,
				migrationOrTransitionPlan: "Plan",
				overview: "Overview",
				securityAndPrivacy: "Protected B",
				serviceNameEn: "Example service",
				serviceNameFr: "Service exemple",
				technologyAndProtocol: "OIDC",
				updatedAt: null,
				usage: "Usage",
				uuid: "application-information-uuid-1",
				workspaceId: 9,
			},
			error: null,
			isLoading: false,
			refetch: vi.fn(() => Promise.resolve()),
		});
		vi.mocked(useApplicationInformationManagement).mockReturnValue({
			createApplicationInformation: vi.fn(),
			deleteApplicationInformation: deleteApplicationMock,
			isCreating: false,
			isDeleting: false,
			isUpdating: false,
			updateApplicationInformation: vi.fn(),
		});

		render(<ApplicationInformationDeletePage />);

		expect(
			screen.getByRole("heading", { level: 1, name: "Delete application" })
		).toBeTruthy();
		expect(screen.queryByRole("dialog")).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: "Delete application" }));
		fireEvent.click(
			screen
				.getByRole("dialog", { name: "Delete application" })
				.querySelector("button")!
		);

		await waitFor(() => {
			expect(deleteApplicationMock).toHaveBeenCalledWith(
				"workspace-uuid-1",
				"application-information-uuid-1"
			);
			expect(navigateMock).toHaveBeenCalledWith({
				params: { workspaceUuid: "workspace-uuid-1" },
				replace: true,
				search: { deleted: "1" },
				to: "/workspaces/$workspaceUuid/applications",
			});
		});
	});
});
